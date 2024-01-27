import type { Selectable, Updateable } from 'kysely';

import type { NoteRepository } from '@domain/service/repository/NoteRepository.js';
import type { NotePatch, NewNote, Note, NoteQuery } from '@domain/model/note.js';

import HierarchyEntityRepository from './HierarchyEntityRepository.js';
import schema, { type Row } from '../schema/note.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';

export default class SqliteNoteRepository extends HierarchyEntityRepository implements NoteRepository {
  public readonly tableName = schema.tableName;
  public async create(note: NewNote) {
    const row = await this.db
      .insertInto(this.tableName)
      .values({
        id: this.generateId(),
        ...SqliteNoteRepository.patchToRow(note),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return SqliteNoteRepository.rowToNote(row);
  }

  public async update(id: Note['id'] | Note['id'][], note: NotePatch) {
    const { numUpdatedRows } = await this.db
      .updateTable(this.tableName)
      .where('id', Array.isArray(id) ? 'in' : '=', id)
      .set({ updatedAt: Date.now(), ...SqliteNoteRepository.patchToRow(note) })
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
        'notes.userUpdatedAt',
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

    if (typeof q.parentId !== 'undefined') {
      sql = sql.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    if (q.id) {
      sql = sql.where('id', 'in', q.id);
    }

    const rows = await sql.execute();
    const notes = rows.map(SqliteNoteRepository.rowToNote);

    return notes;
  }

  public async findOneById(id: Note['id'], availableOnly?: boolean) {
    let sql = this.db.selectFrom(this.tableName).selectAll();

    if (availableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql.executeTakeFirst();
    return row ? SqliteNoteRepository.rowToNote(row) : null;
  }

  private static rowToNote(row: Selectable<Row>): Required<Note>;
  private static rowToNote(row: Omit<Selectable<Row>, 'body'>): Note;
  private static rowToNote(row: Selectable<Row> | Omit<Selectable<Row>, 'body'>) {
    return { ...row, isReadonly: Boolean(row.isReadonly) };
  }

  private static patchToRow(note: NotePatch) {
    return {
      ...note,
      ...(typeof note.isReadonly === 'boolean' ? { isReadonly: note.isReadonly ? 1 : 0 } : null),
    } as Updateable<Row>;
  }
}
