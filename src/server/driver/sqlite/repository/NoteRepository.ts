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
    const row = await this.knex<Row>(noteSchema.tableName).where('id', noteId).first();

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

    const childrenCount = await this.knex<Row>(this.schema.tableName).where('parentId', row.id).count({ count: 'id' });
    return this.rowToVO(row, { childrenCount: Number(childrenCount[0]?.count) });
  }

  async updateBody(id: NoteVO['id'], noteBody: string) {
    const count = await this.knex<Row>(this.schema.tableName).where('id', id).update({ body: noteBody });

    if (count === 0) {
      return null;
    }

    return noteBody;
  }

  async findAll(query?: NoteQuery) {
    const {
      knex,
      schema: { tableName: noteTable },
    } = this;

    const sql = knex
      .select<(Row & { childrenCount: number })[]>(knex.raw('parent.*'), knex.raw('count(child.id) as childrenCount'))
      .from(`${noteTable} as parent`)
      .leftJoin({ child: noteTable }, 'child.parentId', 'parent.id')
      .groupBy('parent.id');

    for (const [k, v] of Object.entries(query || {})) {
      if (v === undefined) {
        continue;
      }

      const newKey = `parent.${k}`;
      Array.isArray(v)
        ? sql.andWhere(newKey, 'in', v)
        : typeof v === 'boolean'
        ? sql.andWhere(newKey, Number(v))
        : sql.andWhere(newKey, v);
    }

    const rows = await sql;
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
      knex,
      schema: { tableName: noteTable },
    } = this;
    const rows: { id: string }[] = await this.knex
      .withRecursive('descendants', (qb) => {
        qb.select('id', 'parentId')
          .from(noteTable)
          .whereIn('parentId', noteIds)
          .union((qb) =>
            qb
              .select(`${noteTable}.id`, `${noteTable}.parentId`)
              .from('descendants')
              .join(knex.raw(noteTable))
              .where(`${noteTable}.parentId`, 'descendants.id'),
          );
        // todo: add a limit statement to stop infinite recursive
      })
      .select('descendants.id')
      .from('descendants');

    return rows.map(({ id }) => String(id));
  }

  async findTreeFragment(noteId: NoteVO['id']) {
    const {
      knex,
      schema: { tableName: noteTable },
    } = this;
    const ancestorIds = await knex
      .withRecursive('ancestors', (qb) =>
        qb
          .from(noteTable)
          .where('id', noteId)
          .union((qb) =>
            qb
              .select(knex.raw(`${noteTable}.*`))
              .from('ancestors')
              .join(knex.raw(noteTable), `${noteTable}.id`, 'ancestors.parentId'),
          ),
      )
      .select('ancestors.id')
      .from('ancestors');

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
    const notes = await this.knex<Row>(this.schema.tableName).select('attributes').where('attributes', '<>', '{}');

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
    await this.knex<Row>(this.schema.tableName)
      .delete()
      .where('id', typeof noteId === 'string' ? '=' : 'in', noteId);
  }
}
