import omit from 'lodash/omit';
import mapValues from 'lodash/mapValues';
import uniq from 'lodash/uniq';

import type { EntityId } from 'interface/entity';
import type { NoteRepository, NoteQuery, InternalNoteDTO } from 'service/repository/NoteRepository';
import type { NoteDTO, NoteVO, NotesDTO, NoteAttributesVO, RawNoteVO } from 'interface/note';

import BaseRepository from './BaseRepository';
import noteSchema, { type Row } from '../schema/note';

interface RowPatch {
  childrenCount?: NoteVO['childrenCount'];
}

export default class SqliteNoteRepository extends BaseRepository<Row> implements NoteRepository {
  protected readonly schema = noteSchema;
  async create(note: InternalNoteDTO): Promise<RawNoteVO> {
    const row = await this._createOrUpdate(SqliteNoteRepository.dtoToRow(note));

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
    const row = await this._createOrUpdate(SqliteNoteRepository.dtoToRow(note), id);

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
      const row = await this._createOrUpdate(note, note.id);

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

  private rowToVO(row: Row & RowPatch, patch?: RowPatch): RawNoteVO {
    return {
      ...omit(row, ['body']),
      parentId: row.parentId || null,
      isReadonly: Boolean(row.isReadonly),
      childrenCount: patch?.childrenCount || row.childrenCount || 0,
      attributes: JSON.parse(row.attributes),
    };
  }

  private static dtoToRow(note: NoteDTO) {
    return note.attributes ? { ...note, attributes: JSON.stringify(note.attributes) } : note;
  }

  async findAttributes() {
    const result: NoteAttributesVO = {};
    const notes = await this.db
      .selectFrom(this.schema.tableName)
      .select('attributes')
      .where('attributes', '<>', '{}')
      .execute();

    for (const { attributes } of notes) {
      for (const [k, v] of Object.entries(JSON.parse(attributes))) {
        if (!result[k]) {
          result[k] = [];
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result[k]!.push(v as string);
      }
    }

    return mapValues(result, uniq);
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
