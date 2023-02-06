import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import mapKeys from 'lodash/mapKeys';
import isUndefined from 'lodash/isUndefined';

import type { NoteRepository, NoteQuery } from 'service/repository/NoteRepository';
import type { NoteDTO, NoteVO, NoteBodyDTO, NotesDTO } from 'interface/Note';
import { RecyclablesTypes } from 'service/RecyclableService';

import BaseRepository from './BaseRepository';
import noteSchema, { type Row } from '../schema/noteSchema';
import recyclableSchema from '../schema/recyclableSchema';

export default class SqliteNoteRepository extends BaseRepository<Row> implements NoteRepository {
  protected readonly schema = noteSchema;
  async create(note: NoteDTO): Promise<NoteVO> {
    const row = await this.createOrUpdate(note);

    return {
      ...omit(row, 'body'),
      id: String(row.id),
      parentId: note.parentId || null,
      isReadonly: note.isReadonly || false,
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
    const row = await this.createOrUpdate(note, id);

    if (!row) {
      return null;
    }

    const childrenCount = await this.knex<Row>(this.schema.tableName).where('parentId', row.id).count({ count: 'id' });

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
      return null;
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
    const sql = knex
      .select<(Row & { childrenCount: number })[]>(knex.raw('parent.*'), knex.raw('count(child.id) as childrenCount'))
      .from(`${noteTable} as parent`)
      .leftJoin(
        this.knex(noteTable)
          .leftJoin(recyclableTable, function () {
            this.on(`${recyclableTable}.entityType`, '=', knex.raw(RecyclablesTypes.Note));
            this.on(`${recyclableTable}.entityId`, `${noteTable}.id`);
          })
          .whereNull(`${recyclableTable}.entityId`)
          .as('child'),
        'child.parentId',
        'parent.id',
      )
      .leftJoin(recyclableTable, function () {
        this.on(`${recyclableTable}.entityType`, '=', knex.raw(RecyclablesTypes.Note));
        this.on(`${recyclableTable}.entityId`, 'parent.id');
      })
      .whereNull(`${recyclableTable}.entityId`)
      .groupBy('parent.id');

    for (const [k, v] of Object.entries(where)) {
      Array.isArray(v) ? sql.andWhere(k, 'in', v) : sql.andWhere(k, v);
    }

    const rows = await sql;
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

  private isAvailableSql(noteId: NoteVO['id'] | NoteVO['id'][]) {
    const recyclableTable = recyclableSchema.tableName;
    const {
      knex,
      schema: { tableName: noteTable },
    } = this;
    const sql = this.knex<Row>(this.schema.tableName)
      .leftJoin(recyclableTable, function () {
        this.on(`${recyclableTable}.entityType`, knex.raw(RecyclablesTypes.Note));
        this.on(`${recyclableTable}.entityId`, `${noteTable}.id`);
      })
      .whereNull(`${recyclableTable}.entityId`);

    if (Array.isArray(noteId)) {
      sql.whereIn(`${noteTable}.id`, noteId.map(Number));
    } else {
      sql.where(`${noteTable}.id`, Number(noteId)).first();
    }

    return sql;
  }

  async isAvailable(noteId: NoteVO['id'] | NoteVO['id'][]) {
    const rows = await this.isAvailableSql(noteId);

    return Array.isArray(noteId) ? rows.length === noteId.length : Boolean(rows);
  }

  async isWritable(noteId: NoteVO['id']) {
    const row = await this.isAvailableSql(noteId).andWhere(`${this.schema.tableName}.isReadonly`, 0);

    return Boolean(row);
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
}
