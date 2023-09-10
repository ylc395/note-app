import type { Selectable, Updateable } from 'kysely';

import type { NoteRepository } from 'service/repository/NoteRepository';
import type { NoteVO, NoteQuery, NotePatch, NewNote, Note } from 'model/note';

import HierarchyEntityRepository from './HierarchyEntityRepository';
import schema, { type Row } from '../schema/note';
import { tableName as recyclableTableName } from '../schema/recyclable';

const fields = ['id', 'icon', 'isReadonly', 'title', 'parentId', 'userUpdatedAt', 'createdAt', 'updatedAt'] as const;

export default class SqliteNoteRepository extends HierarchyEntityRepository implements NoteRepository {
  readonly tableName = schema.tableName;
  async create(note: NewNote) {
    const row = await this.db
      .insertInto(this.tableName)
      .values({
        id: this.generateId(),
        ...SqliteNoteRepository.patchToRow(note),
      })
      .returning(fields)
      .executeTakeFirstOrThrow();

    return this.rowToNote(row);
  }

  async findBody(noteId: string) {
    const row = await this.db.selectFrom(this.tableName).select('body').where('id', '=', noteId).executeTakeFirst();

    if (!row) {
      return null;
    }

    return row.body;
  }

  update(noteId: Note['id'], patch: NotePatch): Promise<Note | null>;
  update(noteIds: Note['id'][], patch: NotePatch): Promise<Note[]>;
  async update(id: Note['id'] | Note['id'][], note: NotePatch) {
    const rows = await this.db
      .updateTable(this.tableName)
      .where('id', Array.isArray(id) ? 'in' : '=', id)
      .set({ updatedAt: this.getTimestamp(), ...SqliteNoteRepository.patchToRow(note) })
      .returning(fields)
      .execute();

    if (Array.isArray(id)) {
      return rows.map(this.rowToNote);
    }

    return rows[0] ? this.rowToNote(rows[0]) : null;
  }

  async findAll(q?: NoteQuery) {
    let sql = this.db.selectFrom(this.tableName).select(fields);

    if (typeof q?.isAvailable === 'boolean') {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, q.isAvailable ? 'is' : 'is not', null);
    }

    if (q?.updatedAfter) {
      sql = sql.where('updatedAt', '>', q.updatedAfter);
    }

    if (typeof q?.parentId !== 'undefined') {
      sql = sql.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    if (q?.id) {
      sql = sql.where('id', 'in', q.id);
    }

    const rows = await sql.execute();
    const notes = rows.map((row) => this.rowToNote(row));

    return notes;
  }

  private rowToNote(row: Omit<Selectable<Row>, 'body'>) {
    return {
      ...row,
      isReadonly: Boolean(row.isReadonly),
    };
  }

  private static patchToRow(note: NotePatch) {
    return {
      ...note,
      ...(typeof note.isReadonly === 'boolean' ? { isReadonly: note.isReadonly ? 1 : 0 } : null),
    } as Updateable<Row>;
  }

  async findOneById(id: NoteVO['id']) {
    const note = await this.findAll({ id: [id] });

    return note[0] || null;
  }

  async removeById(noteId: NoteVO['id'] | NoteVO['id'][]) {
    await this.db
      .deleteFrom(this.tableName)
      .where('id', typeof noteId === 'string' ? '=' : 'in', noteId)
      .execute();
  }
}
