import type { NoteRepository, NotePatch, NoteQuery } from '#domain/server/repository/noteRepository.js';
import type { Note, NoteVO } from '#domain/shared/model/note.js';
import { keyBy, mapValues } from 'lodash-es';

import schema from '../schema/note.js';
import { tableName as fileTableName } from '../schema/file.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import BaseRepository from './BaseRepository.js';
import FileRepository from './FileRepository.js';
import SqliteFileRepository from './FileRepository.js';

export default class SqliteNoteRepository extends BaseRepository implements NoteRepository {
  public readonly tableName = schema.tableName;
  public async create(note: Required<Note>) {
    const row = await this.db
      .insertInto(this.tableName)
      .values(note)
      .returning([
        'id',
        'icon',
        'type',
        'title',
        'createdAt',
        'updatedAt',
        'parentId',
        'body',
        'bodyPlainText',
        'fileId',
        'sourceUrl',
      ])
      .executeTakeFirstOrThrow();

    return row;
  }

  public async update(id: NoteVO['id'] | NoteVO['id'][], note: NotePatch) {
    const { numUpdatedRows } = await this.db
      .updateTable(this.tableName)
      .where('id', Array.isArray(id) ? 'in' : '=', id)
      .set(note)
      .executeTakeFirst();

    return Array.isArray(id) ? id.length === Number(numUpdatedRows) : Number(numUpdatedRows) === 1;
  }

  public async findAll(q: NoteQuery) {
    let sql = this.db
      .selectFrom(this.tableName)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.icon`,
        `${this.tableName}.parentId`,
        `${this.tableName}.title`,
        `${this.tableName}.updatedAt`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.fileId`,
        `${this.tableName}.sourceUrl`,
      ]);

    if (q.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    if (Array.isArray(q.parentId)) {
      sql = sql.where('parentId', 'in', q.parentId);
    } else if (typeof q.parentId !== 'undefined') {
      sql = sql.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    if (q.id) {
      sql = sql.where('id', 'in', q.id);
    }

    if (q.type) {
      sql = sql.where('type', '=', q.type);
    }

    if (q.fileHash) {
      sql = sql
        .innerJoin(fileTableName, `${fileTableName}.id`, `${this.tableName}.fileId`)
        .where(`${fileTableName}.hash`, '=', q.fileHash);
    }

    const rows = await sql.execute();
    return rows;
  }

  public async findOneById(id: NoteVO['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = await this.db.selectFrom(this.tableName).where('id', '=', id);

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql.selectAll().executeTakeFirst();
    return row || null;
  }

  public async findBlobById(id: Note['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .innerJoin(fileTableName, `${this.tableName}.fileId`, `${fileTableName}.id`)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
      .select([`${fileTableName}.data`])
      .where(`${this.tableName}.id`, '=', id);

    if (config?.isAvailableOnly) {
      sql = sql.where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql.executeTakeFirst();

    if (row) {
      return FileRepository.getBlob(row);
    }

    return null;
  }

  public async findFiles(ids: Note['id'][]) {
    const rows = await this.db
      .selectFrom(fileTableName)
      .innerJoin(this.tableName, `${fileTableName}.id`, `${this.tableName}.fileId`)
      .where(`${fileTableName}.id`, 'in', ids)
      .select([
        `${fileTableName}.id`,
        'mimeType',
        'lang',
        'size',
        'hash',
        `${fileTableName}.isTemp`,
        `${this.tableName}.id as noteId`,
      ])
      .execute();

    return mapValues(
      keyBy(rows, (file) => file.noteId),
      ({ noteId: _, ...file }) => SqliteFileRepository.rowToFileVO(file),
    );
  }
}
