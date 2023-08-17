import type { Selectable } from 'kysely';
import omit from 'lodash/omit';

import type { EntityId } from 'model/entity';
import type { NoteRepository } from 'service/repository/NoteRepository';
import type { NoteVO, NotesPatchDTO, NoteQuery, NotePatch, NewNote, NotePatchDTO } from 'model/note';

import HierarchyEntityRepository from './HierarchyEntityRepository';
import schema, { type Row } from '../schema/note';

export default class SqliteNoteRepository extends HierarchyEntityRepository implements NoteRepository {
  readonly tableName = schema.tableName;
  async create(note: NewNote) {
    const row = await this.createOne(this.tableName, {
      ...SqliteNoteRepository.dtoToRow(note),
      id: this.generateId(),
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

  async update(id: NoteVO['id'], note: NotePatch) {
    const row = await this.updateOne(this.tableName, id, SqliteNoteRepository.dtoToRow(note));

    if (!row) {
      return null;
    }

    return this.rowToVO(row);
  }

  async updateBody(id: NoteVO['id'], noteBody: string) {
    const { numUpdatedRows } = await this.db
      .updateTable(this.tableName)
      .where('id', '=', id)
      .set({ body: noteBody })
      .executeTakeFirst();

    if (numUpdatedRows === 0n) {
      return null;
    }

    return noteBody;
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

  async batchUpdate(notes: NotesPatchDTO) {
    const ids: EntityId[] = [];

    for (const note of notes) {
      const row = await this.updateOne(this.tableName, note.id, SqliteNoteRepository.dtoToRow(note));

      if (!row) {
        continue;
      }

      ids.push(String(row.id));
    }

    const rows = await this.findAll({ id: ids });

    return rows;
  }

  private rowToVO(row: Selectable<Row>) {
    return {
      ...omit(row, ['body']),
      isReadonly: Boolean(row.isReadonly),
    };
  }

  private static dtoToRow(note: NotePatchDTO) {
    return {
      ...note,
      ...('isReadonly' in note ? { isReadonly: note.isReadonly ? (1 as const) : (0 as const) } : null),
    } as Omit<Selectable<Row>, 'id'>;
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
