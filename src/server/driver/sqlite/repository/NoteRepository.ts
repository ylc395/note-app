import type { Selectable, Updateable } from 'kysely';

import type { NoteRepository } from 'service/repository/NoteRepository';
import type { NoteVO, NoteQuery, NotePatch, NewNote, Note } from 'model/note';

import HierarchyEntityRepository from './HierarchyEntityRepository';
import schema, { type Row } from '../schema/note';

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

  async findAll(query?: NoteQuery | { parentIds: NoteVO['id'][] }) {
    let sql = this.db.selectFrom(this.tableName).select(fields);

    for (const [k, v] of Object.entries(query || {})) {
      if (v === undefined) {
        continue;
      }

      sql = Array.isArray(v)
        ? sql.where(k as keyof NoteQuery, 'in', v)
        : typeof v === 'boolean'
        ? sql.where(k as keyof NoteQuery, '=', Number(v))
        : sql.where(k as keyof NoteQuery, v === null ? 'is' : '=', v);
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
