import omit from 'lodash/omit';

import type { EntityId } from 'interface/entity';
import type { NoteRepository, NoteQuery, InternalNoteDTO } from 'service/repository/NoteRepository';
import type { NoteDTO, NoteVO, NotesDTO, RawNoteVO } from 'interface/note';

import BaseRepository from './BaseRepository';
import noteSchema, { type Row } from '../schema/note';
import type { Selectable } from 'kysely';

interface RowPatch {
  childrenCount?: NoteVO['childrenCount'];
}

export default class SqliteNoteRepository extends BaseRepository implements NoteRepository {
  protected readonly schema = noteSchema;
  async create(note: InternalNoteDTO): Promise<RawNoteVO> {
    const row = await this.createOne(this.schema.tableName, {
      ...SqliteNoteRepository.dtoToRow(note),
      id: this.generateId(),
    });

    return this.rowToVO(row);
  }

  async findBody(noteId: string): Promise<string | null> {
    const row = await this.db
      .selectFrom(noteSchema.tableName)
      .select('body')
      .where('id', '=', noteId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return row.body;
  }

  async update(id: NoteVO['id'], note: InternalNoteDTO) {
    const row = await this.updateOne(this.schema.tableName, id, SqliteNoteRepository.dtoToRow(note));

    if (!row) {
      return null;
    }

    const childrenCount = await this.db
      .selectFrom(this.schema.tableName)
      .where('parentId', '=', row.id)
      .select(this.db.fn.count('id').as('count'))
      .executeTakeFirst();

    return this.rowToVO(row, { childrenCount: Number(childrenCount?.count) });
  }

  async updateBody(id: NoteVO['id'], noteBody: string) {
    const { numUpdatedRows } = await this.db
      .updateTable(this.schema.tableName)
      .where('id', '=', id)
      .set({ body: noteBody })
      .executeTakeFirst();

    if (numUpdatedRows === 0n) {
      return null;
    }

    return noteBody;
  }

  async findAll(query?: NoteQuery) {
    const {
      schema: { tableName: noteTable },
    } = this;

    let sql = this.db
      .selectFrom(`${noteTable} as parent`)
      .leftJoin(`${noteTable} as child`, 'child.parentId', 'parent.id')
      .select((eb) => eb.fn.count('child.id').as('childrenCount'))
      .selectAll('parent')
      .groupBy('parent.id');

    for (const [k, v] of Object.entries(query || {})) {
      if (v === undefined) {
        continue;
      }

      sql = Array.isArray(v)
        ? sql.where(`parent.${k as keyof NoteQuery}`, 'in', v)
        : typeof v === 'boolean'
        ? sql.where(`parent.${k as keyof NoteQuery}`, '=', Number(v))
        : sql.where(`parent.${k as keyof NoteQuery}`, v === null ? 'is' : '=', v);
    }

    const rows = await sql.execute();
    const notes = rows.map((row) => this.rowToVO(row));

    return notes;
  }

  async batchUpdate(notes: NotesDTO) {
    const ids: EntityId[] = [];

    for (const note of notes) {
      const row = await this.updateOne(this.schema.tableName, note.id, SqliteNoteRepository.dtoToRow(note));

      if (!row) {
        continue;
      }

      ids.push(String(row.id));
    }

    const rows = await this.findAll({ id: ids });

    return rows;
  }

  async findAllDescendantIds(noteIds: NoteVO['id'][]) {
    if (noteIds.length === 0) {
      return [];
    }

    const {
      schema: { tableName: noteTable },
    } = this;

    const rows = await this.db
      .withRecursive(
        'descendants',
        (qb) =>
          qb
            .selectFrom(noteTable)
            .select(['id', 'parentId'])
            .where('parentId', 'in', noteIds)
            .union(
              qb
                .selectFrom('descendants')
                .innerJoin(noteTable, `${noteTable}.id`, 'descendants.id')
                .select([`${noteTable}.id`, `${noteTable}.parentId`])
                .where(`${noteTable}.parentId`, '=', 'descendants.id'),
            ),
        // todo: add a limit statement to stop infinite recursive
      )
      .selectFrom('descendants')
      .select('descendants.id')
      .execute();

    return rows.map(({ id }) => id);
  }

  async findTreeFragment(noteId: NoteVO['id']) {
    const {
      schema: { tableName: noteTable },
    } = this;
    const ancestorIds = await this.db
      .withRecursive('ancestors', (qb) =>
        qb
          .selectFrom(noteTable)
          .selectAll()
          .where('id', '=', noteId)
          .union(
            qb
              .selectFrom('ancestors')
              .innerJoin(noteTable, `${noteTable}.id`, 'ancestors.parentId')
              .selectAll(noteTable),
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

  private rowToVO(row: Selectable<Row> & RowPatch, patch?: RowPatch): RawNoteVO {
    return {
      ...omit(row, ['body']),
      parentId: row.parentId || null,
      isReadonly: Boolean(row.isReadonly),
      childrenCount: patch?.childrenCount || row.childrenCount || 0,
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
      .deleteFrom(this.schema.tableName)
      .where('id', typeof noteId === 'string' ? '=' : 'in', noteId)
      .execute();
  }
}
