import type { Selectable, Updateable } from 'kysely';
import compact from 'lodash/compact';

import type { NoteRepository, NoteQuery } from 'service/repository/NoteRepository';
import type { NotePatch, NewNote, Note } from 'model/note';

import HierarchyEntityRepository from './HierarchyEntityRepository';
import schema, { type Row } from '../schema/note';
import { tableName as recyclableTableName } from '../schema/recyclable';

export default class SqliteNoteRepository extends HierarchyEntityRepository implements NoteRepository {
  readonly tableName = schema.tableName;
  async create(note?: NewNote) {
    const row = await this.db
      .insertInto(this.tableName)
      .values({
        id: this.generateId(),
        ...(note && SqliteNoteRepository.patchToRow(note)),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.rowToNote(row) as Required<Note>;
  }

  async update(id: Note['id'] | Note['id'][], note: NotePatch) {
    const { numUpdatedRows } = await this.db
      .updateTable(this.tableName)
      .where('id', Array.isArray(id) ? 'in' : '=', id)
      .set({ updatedAt: Date.now(), ...SqliteNoteRepository.patchToRow(note) })
      .executeTakeFirst();

    return Array.isArray(id) ? id.length === Number(numUpdatedRows) : Number(numUpdatedRows) === 1;
  }

  async findAll(q?: NoteQuery & { containBody?: boolean }) {
    const fields = [
      'id',
      'icon',
      'isReadonly',
      'title',
      'parentId',
      'userUpdatedAt',
      'createdAt',
      'updatedAt',
    ] as const;

    let sql = this.db.selectFrom(this.tableName).select(compact([...fields, q?.containBody && 'body']));

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
    const notes = rows.map((row) => this.rowToNote(row)) as Note[];

    return notes;
  }

  private rowToNote(row: Partial<Selectable<Row>>) {
    return {
      ...row,
      ...(typeof row.isReadonly === 'number' ? { isReadonly: Boolean(row.isReadonly) } : null),
    };
  }

  private static patchToRow(note: NotePatch) {
    return {
      ...note,
      ...(typeof note.isReadonly === 'boolean' ? { isReadonly: note.isReadonly ? 1 : 0 } : null),
    } as Updateable<Row>;
  }

  async findOneById(id: Note['id'], availableOnly?: boolean) {
    const notes = await this.findAll({ id: [id], isAvailable: availableOnly, containBody: true });
    const note = notes[0] as Required<Note>;

    return note || null;
  }

  async removeById(noteId: Note['id'] | Note['id'][]) {
    const result = await this.db
      .deleteFrom(this.tableName)
      .where('id', typeof noteId === 'string' ? '=' : 'in', noteId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) === (Array.isArray(noteId) ? noteId.length : 1);
  }
}
