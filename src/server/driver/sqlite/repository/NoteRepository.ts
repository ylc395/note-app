import type { Selectable } from 'kysely';
import type { NoteRepository } from '@domain/service/repository/NoteRepository.js';
import type { Note, NoteDTO, NotePatch, NoteQuery, NoteVO } from '@domain/model/note.js';

import schema, { Row } from '../schema/note.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import BaseRepository from './BaseRepository.js';

export default class SqliteNoteRepository extends BaseRepository implements NoteRepository {
  public readonly tableName = schema.tableName;
  public async create(note: NoteDTO) {
    const row = await this.db
      .insertInto(this.tableName)
      .values({
        id: this.generateId(),
        ...SqliteNoteRepository.noteToRow(note),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return SqliteNoteRepository.rowToNote(row);
  }

  public async update(id: NoteVO['id'] | NoteVO['id'][], note: NotePatch) {
    const { numUpdatedRows } = await this.db
      .updateTable(this.tableName)
      .where('id', Array.isArray(id) ? 'in' : '=', id)
      .set(SqliteNoteRepository.noteToRow(note))
      .executeTakeFirst();

    return Array.isArray(id) ? id.length === Number(numUpdatedRows) : Number(numUpdatedRows) === 1;
  }

  public async findAll(q: NoteQuery) {
    let sql = this.db
      .selectFrom(this.tableName)
      .select([
        'notes.id',
        'notes.icon',
        'notes.isReadonly',
        'notes.parentId',
        'notes.title',
        'notes.updatedAt',
        'notes.createdAt',
      ]);

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
    return rows.map(SqliteNoteRepository.rowToNote);
  }

  public async findOneById(id: NoteVO['id']) {
    const row = await this.db.selectFrom(this.tableName).where('id', '=', id).selectAll().executeTakeFirst();
    console.log(row);

    return row ? SqliteNoteRepository.rowToNote(row) : null;
  }

  private static rowToNote(row: Selectable<Row>): Required<Note>;
  private static rowToNote(row: Omit<Selectable<Row>, 'body'>): Note;
  private static rowToNote(row: Selectable<Row> | Omit<Selectable<Row>, 'body'>) {
    return { ...row, isReadonly: Boolean(row.isReadonly) };
  }

  private static noteToRow(note: Partial<NotePatch>) {
    return {
      ...note,
      ...{
        isReadonly: typeof note.isReadonly !== 'boolean' ? undefined : note.isReadonly ? (1 as const) : (0 as const),
      },
    };
  }
}
