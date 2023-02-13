import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import mapKeys from 'lodash/mapKeys';
import isUndefined from 'lodash/isUndefined';

import { EntityTypes } from 'interface/Entity';
import type { NoteRepository, NoteQuery } from 'service/repository/NoteRepository';
import type { NoteDTO, NoteVO, NoteBodyDTO, NotesDTO } from 'interface/Note';

import BaseRepository from './BaseRepository';
import RecyclableRepository from './RecyclableRepository';
import noteSchema, { type Row } from '../schema/noteSchema';
import starSchema, { type Row as StarRow } from '../schema/starSchema';

interface NoteVOPatch {
  childrenCount?: NoteVO['childrenCount'];
  starId?: StarRow['id'] | null;
}

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
    return this.rowToVO(row, { childrenCount: Number(childrenCount[0]?.count) });
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

    const sql = RecyclableRepository.withoutRecyclables(this.knex.queryBuilder(), 'parent', knex.raw(EntityTypes.Note))
      .select<(Row & { childrenCount: number; starId: number | null })[]>(
        knex.raw('parent.*'),
        knex.raw('count(child.id) as childrenCount'),
        knex.raw(`${starSchema.tableName}.id as starId`),
      )
      .from(`${noteTable} as parent`)
      .leftJoin(
        RecyclableRepository.withoutRecyclables(this.knex.queryBuilder(), noteTable, knex.raw(EntityTypes.Note))
          .from(noteTable)
          .as('child'),
        'child.parentId',
        'parent.id',
      )
      .leftJoin(starSchema.tableName, function () {
        this.on(`${starSchema.tableName}.entityType`, knex.raw(EntityTypes.Note));
        this.on(`${starSchema.tableName}.entityId`, 'parent.id');
      })
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
    const rows: { id: string }[] = await RecyclableRepository.withoutRecyclables(
      this.knex.queryBuilder(),
      'descendants',
      knex.raw(EntityTypes.Note),
    )
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
      .queryBuilder()
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

  private rowToVO(row: Row & NoteVOPatch, patch?: NoteVOPatch): NoteVO {
    return {
      ...omit(row, 'body'),
      id: String(row.id),
      parentId: row.parentId ? String(row.parentId) : null,
      isReadonly: Boolean(row.isReadonly),
      childrenCount: patch?.childrenCount || row.childrenCount || 0,
      isStar: Boolean(patch?.starId || row.starId || false),
    };
  }
}
