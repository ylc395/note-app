import type { NoteRepository } from '@domain/service/repository/NoteRepository.js';
import type { NoteDTO, NotePatch, NoteQuery, NoteVO } from '@domain/model/note.js';

import schema from '../schema/note.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import BaseRepository from './BaseRepository.js';

export default class SqliteNoteRepository extends BaseRepository implements NoteRepository {
  public readonly tableName = schema.tableName;
  public async create(note: NoteDTO) {
    const row = await this.db
      .insertInto(this.tableName)
      .values({ id: this.generateId(), ...note })
      .returningAll()
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
      .select(['notes.id', 'notes.icon', 'notes.parentId', 'notes.title', 'notes.updatedAt', 'notes.createdAt']);

    if (typeof q.isAvailable === 'boolean') {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, q.isAvailable ? 'is' : 'is not', null);
    }

    if (q.updatedAfter) {
      sql = sql.where('updatedAt', '>', q.updatedAfter);
    }

    if (Array.isArray(q.parentId)) {
      sql = sql.where('parentId', 'in', q.parentId);
    } else if (typeof q.parentId !== 'undefined') {
      sql = sql.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    if (q.id) {
      sql = sql.where('id', 'in', q.id);
    }

    const rows = await sql.execute();
    return rows;
  }

  public async findOneById(id: NoteVO['id']) {
    const row = await this.db.selectFrom(this.tableName).where('id', '=', id).selectAll().executeTakeFirst();
    return row || null;
  }
}
