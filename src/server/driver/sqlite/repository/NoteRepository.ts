import type { Selectable, Updateable } from 'kysely';
import omit from 'lodash/omit';

import type { NoteRepository } from 'service/repository/NoteRepository';
import type { NoteVO, NoteQuery, NotePatch, NewNote, Note } from 'model/note';

import HierarchyEntityRepository from './HierarchyEntityRepository';
import schema, { type Row } from '../schema/note';

export default class SqliteNoteRepository extends HierarchyEntityRepository implements NoteRepository {
  readonly tableName = schema.tableName;
  async create(note: NewNote) {
    const row = await this.createOne(this.tableName, {
      id: this.generateId(),
      ...SqliteNoteRepository.dtoToRow(note),
    });

    return this.rowToVO(row);
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
      .set({ updatedAt: this.getTimestamp(), ...SqliteNoteRepository.dtoToRow(note) })
      .returning(['id', 'icon', 'isReadonly', 'title', 'parentId', 'userUpdatedAt', 'createdAt', 'updatedAt'])
      .execute();

    if (Array.isArray(id)) {
      return rows.map(this.rowToVO);
    }

    return rows[0] ? this.rowToVO(rows[0]) : null;
  }

  async findAll(query?: NoteQuery | { parentIds: NoteVO['id'][] }) {
    let sql = this.db.selectFrom(this.tableName).selectAll();

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
    const notes = rows.map((row) => this.rowToVO(row));

    return notes;
  }

  private rowToVO(row: Omit<Selectable<Row>, 'body'>) {
    return {
      ...omit(row, ['userUpdatedAt']),
      isReadonly: Boolean(row.isReadonly),
      updatedAt: row.userUpdatedAt,
    };
  }

  private static dtoToRow(note: NotePatch) {
    return {
      ...note,
      ...(note.updatedAt ? { userUpdatedAt: note.updatedAt } : null),
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
