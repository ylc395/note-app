import type { Selectable } from 'kysely';
import omit from 'lodash/omit';

import type { EntityId } from 'model/entity';
import type { NoteQuery, RawNote } from 'model/note';
import type { NoteRepository } from 'service/repository/NoteRepository';
import type { NoteDTO, NoteVO, NotesDTO } from 'model/note';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/note';
import { groupDescantsByAncestorId } from './treeHelper';

const { tableName } = schema;

export default class SqliteNoteRepository extends BaseRepository implements NoteRepository {
  async create(note: RawNote) {
    const row = await this.createOne(tableName, {
      ...SqliteNoteRepository.dtoToRow(note),
      id: this.generateId(),
    });

    return this.rowToVO(row);
  }

  async findBody(noteId: string) {
    const row = await this.db.selectFrom(tableName).select('body').where('id', '=', noteId).executeTakeFirst();

    if (!row) {
      return null;
    }

    return row.body;
  }

  async update(id: NoteVO['id'], note: RawNote) {
    const row = await this.updateOne(tableName, id, SqliteNoteRepository.dtoToRow(note));

    if (!row) {
      return null;
    }

    return this.rowToVO(row);
  }

  async updateBody(id: NoteVO['id'], noteBody: string) {
    const { numUpdatedRows } = await this.db
      .updateTable(tableName)
      .where('id', '=', id)
      .set({ body: noteBody })
      .executeTakeFirst();

    if (numUpdatedRows === 0n) {
      return null;
    }

    return noteBody;
  }

  async findAll(query?: NoteQuery | { parentId: NoteVO['id'][] }) {
    let sql = this.db.selectFrom(tableName).selectAll();

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

  async batchUpdate(notes: NotesDTO) {
    const ids: EntityId[] = [];

    for (const note of notes) {
      const row = await this.updateOne(tableName, note.id, SqliteNoteRepository.dtoToRow(note));

      if (!row) {
        continue;
      }

      ids.push(String(row.id));
    }

    const rows = await this.findAll({ id: ids });

    return rows;
  }

  async findAllChildren(noteIds: NoteVO['id'][]) {
    const rows = await this.db.selectFrom(tableName).where('parentId', 'in', noteIds).selectAll().execute();
    return rows.map(this.rowToVO);
  }

  async findAllDescendantIds(noteIds: NoteVO['id'][]) {
    if (noteIds.length === 0) {
      return {};
    }

    const rows = await this.db
      .withRecursive(
        'descendants',
        (qb) =>
          qb
            .selectFrom(tableName)
            .select(['id', 'parentId'])
            .where((eb) => eb.or([eb.cmpr('id', 'in', noteIds), eb.cmpr('parentId', 'in', noteIds)]))
            .union(
              qb
                .selectFrom('descendants')
                .innerJoin(tableName, `${tableName}.parentId`, 'descendants.id')
                .select([`${tableName}.id`, `${tableName}.parentId`]),
            ),
        // todo: add a limit statement to stop infinite recursive
      )
      .selectFrom('descendants')
      .select(['descendants.id', 'descendants.parentId'])
      .execute();

    return groupDescantsByAncestorId(noteIds, rows);
  }

  async findTreeFragment(noteId: NoteVO['id']) {
    const ancestorIds = await this.db
      .withRecursive('ancestors', (qb) =>
        qb
          .selectFrom(tableName)
          .selectAll()
          .where('id', '=', noteId)
          .union(
            qb
              .selectFrom('ancestors')
              .innerJoin(tableName, `${tableName}.id`, 'ancestors.parentId')
              .selectAll(tableName),
          ),
      )
      .selectFrom('ancestors')
      .select('ancestors.id')
      .execute();

    const children = [
      ...(await this.findAll({ parentId: null })),
      ...(await this.findAll({ parentId: ancestorIds.map(({ id }) => id) })),
    ];

    return children;
  }

  private rowToVO(row: Selectable<Row>) {
    return {
      ...omit(row, ['body']),
      isReadonly: Boolean(row.isReadonly),
    };
  }

  private static dtoToRow(note: NoteDTO) {
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
      .deleteFrom(tableName)
      .where('id', typeof noteId === 'string' ? '=' : 'in', noteId)
      .execute();
  }
}
