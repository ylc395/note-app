import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import mapKeys from 'lodash/mapKeys';
import isUndefined from 'lodash/isUndefined';

import type { NoteRepository } from 'service/repository/NoteRepository';
import type { NoteDTO, NoteVO, NoteBodyDTO, NoteQuery } from 'interface/Note';

import BaseRepository from './BaseRepository';
import noteSchema, { type Row } from '../schema/noteSchema';
import recyclableSchema, { RecyclablesTypes } from '../schema/recyclableSchema';

export default class SqliteNoteRepository extends BaseRepository<Row> implements NoteRepository {
  protected readonly schema = noteSchema;
  async create(note: NoteDTO): Promise<NoteVO> {
    const row = await this.createOrUpdate(note);

    return {
      ...omit(row, 'body'),
      id: String(row.id),
      parentId: note.parentId || null,
      isReadonly: note.isReadonly || false,
      icon: note.icon || null,
      childrenCount: 0,
    };
  }

  async findBody(noteId: string): Promise<NoteBodyDTO | null> {
    const row = await this.knex<Row>(noteSchema.tableName).where('id', noteId).first();

    if (!row) {
      return null;
    }

    return row.body;
  }

  async update(id: NoteVO['id'], note: NoteDTO) {
    const trx = await this.knex.transaction();
    const row = await this.createOrUpdate(note, id, trx);

    if (!row) {
      await trx.commit();
      return null;
    }

    const childrenCount = await trx<Row>(this.schema.tableName).where('parentId', row.id).count({ count: 'id' });

    await trx.commit();

    return {
      ...omit(row, ['body']),
      id: String(row.id),
      parentId: row.parentId ? String(row.parentId) : null,
      isReadonly: Boolean(row.isReadonly),
      childrenCount: Number(childrenCount[0]?.count),
    };
  }

  async updateBody(id: NoteVO['id'], noteBody: NoteBodyDTO) {
    const count = await this.knex<Row>(this.schema.tableName).where('id', id).update({ body: noteBody });

    if (count === 0) {
      throw new Error('invalid id');
    }

    return noteBody;
  }

  async findAll(query: NoteQuery) {
    const {
      knex,
      schema: { tableName: noteTable },
    } = this;
    const recyclableTable = recyclableSchema.tableName;
    const where = mapKeys(omitBy(query, isUndefined), (_, key) => `parent.${key}`);
    const rows = await knex
      .select<(Row & { childrenCount: number })[]>(knex.raw('parent.*'), knex.raw('count(child.id) as childrenCount'))
      .from(`${noteTable} as parent`)
      .leftJoin(knex.raw(`${noteTable} as child`), 'child.parentId', 'parent.id')
      .leftJoin(this.knex.raw(`${recyclableTable}`), function () {
        this.on(`${recyclableTable}.type`, '=', knex.raw(RecyclablesTypes.Note));
        this.on(`${recyclableTable}.entityId`, `parent.id`);
      })
      .where({ ...where, [`${recyclableTable}.entityId`]: null })
      .groupBy('parent.id');

    const notes = rows.map((row) => {
      return {
        ...omit(row, ['body']),
        id: String(row.id),
        parentId: row.parentId ? String(row.parentId) : null,
        isReadonly: Boolean(row.isReadonly),
      };
    });

    return notes;
  }

  private isAvailableSql(noteId: string) {
    const recyclableTable = recyclableSchema.tableName;
    const {
      knex,
      schema: { tableName: noteTable },
    } = this;
    const sql = this.knex<Row>(this.schema.tableName)
      .leftJoin(recyclableTable, function () {
        this.on(`${recyclableTable}.type`, knex.raw(RecyclablesTypes.Note));
        this.on(`${recyclableTable}.entityId`, `${noteTable}.id`);
      })
      .where({ [`${recyclableTable}.entityId`]: null, [`${noteTable}.id`]: Number(noteId) })
      .first();

    return sql;
  }

  async isAvailable(noteId: string) {
    const row = await this.isAvailableSql(noteId);

    return Boolean(row);
  }

  async isWritable(noteId: string) {
    const row = await this.isAvailableSql(noteId).andWhere(`${this.schema.tableName}.isReadonly`, 0);

    return Boolean(row);
  }
}
