import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import mapKeys from 'lodash/mapKeys';
import groupBy from 'lodash/groupBy';
import isUndefined from 'lodash/isUndefined';

import type { NoteRepository, NoteQuery } from 'service/repository/NoteRepository';
import { EntityTypes } from 'interface/Entity';
import type { NoteDTO, NoteVO, NoteBodyDTO, NotesDTO } from 'interface/Note';

import BaseRepository from './BaseRepository';
import noteSchema, { type Row } from '../schema/noteSchema';
import recyclableSchema from '../schema/recyclableSchema';

export default class SqliteNoteRepository extends BaseRepository<Row> implements NoteRepository {
  protected readonly schema = noteSchema;
  async create(note: NoteDTO): Promise<NoteVO> {
    const row = await this.createOrUpdate(note);

    return this.rowToVO(row);
  }

  async findBody(noteId: string): Promise<NoteBodyDTO | null> {
    const row = await this.knex<Row>(noteSchema.tableName).where('id', noteId).first();

    if (!row) {
      return null;
    }

    return row.body;
  }

  async update(id: NoteVO['id'], note: NoteDTO) {
    const row = await this.createOrUpdate(note, id);

    if (!row) {
      return null;
    }

    const childrenCount = await this.knex<Row>(this.schema.tableName).where('parentId', row.id).count({ count: 'id' });
    return this.rowToVO(row, Number(childrenCount[0]?.count));
  }

  async updateBody(id: NoteVO['id'], noteBody: NoteBodyDTO) {
    const count = await this.knex<Row>(this.schema.tableName).where('id', id).update({ body: noteBody });

    if (count === 0) {
      return null;
    }

    return noteBody;
  }

  // problem: 是否需要像这样，在 sql 里体现业务逻辑（例如“回收站”的概念）？
  async findAll(query: NoteQuery) {
    const {
      knex,
      schema: { tableName: noteTable },
    } = this;

    const sql = this.withoutRecyclables('parent')
      .select<(Row & { childrenCount: number })[]>(knex.raw('parent.*'), knex.raw('count(child.id) as childrenCount'))
      .from(`${noteTable} as parent`)
      .leftJoin(this.withoutRecyclables(noteTable).from(noteTable).as('child'), 'child.parentId', 'parent.id')
      .groupBy('parent.id');

    const where = mapKeys(omitBy(query, isUndefined), (_, key) => `parent.${key}`);

    for (const [k, v] of Object.entries(where)) {
      Array.isArray(v)
        ? sql.andWhere(k, 'in', v)
        : typeof v === 'boolean'
        ? sql.andWhere(k, Number(v))
        : sql.andWhere(k, v);
    }

    const rows = await sql;
    const notes = rows.map((row) => this.rowToVO(row));

    return notes;
  }

  async areAvailable(noteIds: NoteVO['id'][]) {
    const rows = await this.findAll({ id: noteIds });

    return rows.length === noteIds.length;
  }

  async isWritable(noteId: NoteVO['id']) {
    const row = await this.findAll({ id: noteId, isReadonly: false });

    return row.length === 1;
  }

  async batchUpdate(notes: NotesDTO) {
    const ids: string[] = [];

    for (const note of notes) {
      const row = await this.createOrUpdate(note, note.id);

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
    const rows = await this.withoutRecyclables('descendants')
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
      .select(knex.raw('descendants.*'))
      .from('descendants');

    return rows.map(({ id }) => String(id));
  }

  async findTreeFragment(noteId: NoteVO['id']) {
    const {
      knex,
      schema: { tableName: noteTable },
    } = this;
    const ids = await knex()
      .withRecursive('ancestors', (qb) =>
        qb
          .from(noteTable)
          .where('id', noteId)
          .orWhere('parentId', noteId)
          .orWhereNull('parentId')
          .union((qb) =>
            qb
              .select(knex.raw(`${noteTable}.*`))
              .from('ancestors')
              .join(knex.raw(noteTable), function () {
                this.on(`${noteTable}.id`, 'ancestors.parentId');
                this.orOn('ancestors.id', `${noteTable}.parentId`);
              }),
          ),
      )
      .select('ancestors.id', 'ancestors.parentId')
      .from('ancestors');

    const rows = await this.findAll({ id: ids.map(({ id }) => id) });

    return this.topoSort(rows);
  }

  private rowToVO(row: Row & { childrenCount?: number }, childrenCount?: number): NoteVO {
    return {
      ...omit(row, 'body'),
      id: String(row.id),
      parentId: row.parentId ? String(row.parentId) : null,
      isReadonly: Boolean(row.isReadonly),
      childrenCount: childrenCount || row.childrenCount || 0,
    };
  }

  private topoSort(rows: NoteVO[]) {
    const result: NoteVO[] = [];
    const rowsToCheck: NoteVO[] = [];

    for (const row of rows) {
      if (row.parentId === null) {
        result.push(row);
      } else {
        rowsToCheck.push(row);
      }
    }

    const parents = groupBy(rowsToCheck, 'parentId');

    for (let i = 0; result[i]; i++) {
      const node = result[i];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const children = parents[node!.id];

      if (children) {
        result.push(...children);
      }
    }

    return result;
  }

  private withoutRecyclables(joinTable: string) {
    const recyclableTable = recyclableSchema.tableName;
    const { knex } = this;

    return this.knex
      .queryBuilder()
      .leftJoin(recyclableTable, function () {
        this.on(`${recyclableTable}.entityType`, '=', knex.raw(EntityTypes.Note));
        this.on(`${recyclableTable}.entityId`, `${joinTable}.id`);
      })
      .whereNull(`${recyclableTable}.entityId`);
  }
}
