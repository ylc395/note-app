import { keyBy, mapValues, compact } from 'lodash-es';
import { sql } from 'kysely';

import { markdownToPlain } from '#domain/shared/infra/markdown/parse.js';
import type { NoteRepository } from '#domain/server/repository/noteRepository.js';
import { EntityTypes } from '#domain/shared/model/entity.js';
import type { Note, NoteVO, NewNote, NotePatch, NoteQuery } from '#domain/server/model/note.js';

import schema from '../schema/note.js';
import { tableName as fileTableName } from '../schema/file.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as fileTextTableName } from '../schema/fileText.js';
import BaseRepository from './BaseRepository.js';
import FileRepository from './FileRepository.js';

export default class SqliteNoteRepository extends BaseRepository implements NoteRepository {
  public readonly tableName = schema.tableName;
  public async create(note: NewNote) {
    const bodyPlainText = markdownToPlain(note.body);
    const row = await this.db
      .insertInto(this.tableName)
      .values({ ...note, icon: note.icon && JSON.stringify(note.icon), bodyPlainText, type: EntityTypes.Note })
      .returning(['id', 'icon', 'title', 'createdAt', 'updatedAt', 'parentId', 'body', 'fileId', 'sourceUrl'])
      .executeTakeFirstOrThrow();

    return row;
  }

  public async update(id: NoteVO['id'] | NoteVO['id'][], note: NotePatch) {
    const bodyPlainText = typeof note.body === 'string' ? markdownToPlain(note.body) : undefined;
    const { numUpdatedRows } = await this.db
      .updateTable(this.tableName)
      .where('id', Array.isArray(id) ? 'in' : '=', id)
      .where('type', '=', EntityTypes.Note)
      .set({ ...note, icon: note.icon && JSON.stringify(note.icon), bodyPlainText })
      .executeTakeFirst();

    return Array.isArray(id) ? id.length === Number(numUpdatedRows) : Number(numUpdatedRows) === 1;
  }

  public async findAll(q: NoteQuery) {
    let sql = this.db
      .selectFrom(this.tableName)
      .leftJoin(fileTableName, `${this.tableName}.fileId`, `${fileTableName}.id`)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.icon`,
        `${this.tableName}.parentId`,
        `${this.tableName}.title`,
        `${this.tableName}.updatedAt`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.fileId`,
        `${this.tableName}.sourceUrl`,
        `${fileTableName}.mimeType`,
      ])
      .where(`${this.tableName}.type`, '=', EntityTypes.Note);

    if (q.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    if (Array.isArray(q.parentId)) {
      const parentIds = q.parentId;

      sql = sql.where((eb) => {
        return eb.or(
          compact([eb('parentId', 'in', parentIds), parentIds.includes(null) && eb('parentId', 'is', null)]),
        );
      });
    } else if (typeof q.parentId !== 'undefined') {
      sql = sql.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    if (q.id) {
      sql = sql.where(`${this.tableName}.id`, 'in', q.id);
    }

    if (q.fileHash) {
      sql = sql.where(`${fileTableName}.hash`, '=', q.fileHash);
    }

    if (q.sourceUrl) {
      sql = sql.where(`${this.tableName}.sourceUrl`, '=', q.sourceUrl);
    }

    const rows = await sql.execute();
    return rows;
  }

  public async findOneById(id: NoteVO['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .leftJoin(fileTableName, `${this.tableName}.fileId`, `${fileTableName}.id`)
      .where(`${this.tableName}.id`, '=', id)
      .where(`${this.tableName}.type`, '=', EntityTypes.Note);

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.icon`,
        `${this.tableName}.parentId`,
        `${this.tableName}.title`,
        `${this.tableName}.updatedAt`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.body`,
        `${this.tableName}.bodyPlainText`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.fileId`,
        `${this.tableName}.sourceUrl`,
        `${fileTableName}.mimeType`,
      ])
      .executeTakeFirst();
    return row || null;
  }

  public async findBlobById(id: Note['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .innerJoin(fileTableName, `${this.tableName}.fileId`, `${fileTableName}.id`)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
      .select([`${fileTableName}.data`])
      .where(`${this.tableName}.id`, '=', id)
      .where(`${this.tableName}.type`, '=', EntityTypes.Note);

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
      .where(`${this.tableName}.id`, 'in', ids)
      .where(`${this.tableName}.type`, '=', EntityTypes.Note)
      .select([`${fileTableName}.id`, 'mimeType', 'lang', 'size', 'hash', `${this.tableName}.id as noteId`])
      .execute();

    return mapValues(
      keyBy(rows, (file) => file.noteId),
      ({ noteId: _, ...file }) => file,
    );
  }

  public async findFileTextLocation(id: Note['id'], q: { page: number }) {
    const s = this.db
      .selectFrom(this.tableName)
      .innerJoin(fileTextTableName, `${this.tableName}.fileId`, `${fileTextTableName}.fileId`)
      .select([`${fileTextTableName}.location`])
      .where(`${this.tableName}.id`, '=', id)
      .where((eb) => eb(sql`location ->> 'page'`, '=', q.page))
      .where(`${this.tableName}.type`, '=', EntityTypes.Note);

    const row = await s.executeTakeFirst();
    return row?.location || null;
  }

  public async findAllCustomIcons() {
    const rows = await this.db
      .selectFrom(this.tableName)
      .where(sql`icon ->> 'type'`, '=', 'file')
      .where(`${this.tableName}.type`, '=', EntityTypes.Note)
      .select(sql<string>`icon ->> 'code'`.as('code'))
      .distinct()
      .execute();

    return rows.map(({ code }) => ({ type: 'file' as const, code }));
  }
}
