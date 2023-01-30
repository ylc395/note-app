import omit from 'lodash/omit';
import mapKeys from 'lodash/mapKeys';

import type { NoteRepository } from 'service/repository/NoteRepository';
import type { NoteDTO, NoteVO, NoteBodyDTO, NoteQuery } from 'interface/Note';

import BaseRepository from './BaseRepository';
import noteSchema, { type Row } from '../schema/noteSchema';

export default class SqliteNoteRepository extends BaseRepository<Row> implements NoteRepository {
  protected readonly schema = noteSchema;
  async create(note: NoteDTO): Promise<NoteVO> {
    const trx = await this.knex.transaction();

    try {
      note.parentId && (await this.assertExistenceById(note.parentId, trx));
      const row = await this.createOrUpdate(note, trx);

      await trx.commit();

      return {
        ...omit(row, 'body'),
        id: String(row.id),
        parentId: note.parentId || null,
        isReadonly: note.isReadonly || false,
        icon: note.icon || null,
        childrenCount: 0,
      };
    } catch (e) {
      await trx.rollback();
      throw e;
    }
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

    try {
      note.parentId && (await this.assertExistenceById(note.parentId, trx));

      const row = await this.createOrUpdate(note, id, trx);
      const json = JSON.parse(row.json || '{}');
      const childrenCount = await trx<Row>(this.schema.tableName).where('parentId', row.id).count({ count: 'id' });

      await trx.commit();

      return {
        ...row,
        id: String(row.id),
        parentId: note.parentId || null,
        isReadonly: json.isReadonly || false,
        icon: json.icon || null,
        childrenCount: Number(childrenCount[0]?.count),
      };
    } catch (error) {
      trx.rollback(error);
      throw error;
    }
  }

  async updateBody(id: NoteVO['id'], noteBody: NoteBodyDTO) {
    const count = await this.knex<Row>(this.schema.tableName).where('id', id).update({ body: noteBody });

    if (count === 0) {
      throw new Error('invalid id');
    }

    return noteBody;
  }

  async findAll(query: NoteQuery) {
    const rows = await this.knex
      .select<(Row & { childrenCount: number; json: string })[]>(
        this.knex.raw('parent.*'),
        this.knex.raw('count(child.id) as childrenCount'),
      )
      .from(`${this.schema.tableName} as parent`)
      .leftJoin(this.knex.raw(`${this.schema.tableName} as child`), 'child.parentId', 'parent.id')
      .where(mapKeys(query, (_, key) => `parent.${key}`))
      .groupBy('parent.id');

    const notes = rows.map((row) => {
      const json = JSON.parse(row.json || '{}');

      return {
        ...omit(row, ['body', 'json']),
        id: String(row.id),
        parentId: row.parentId ? String(row.parentId) : null,
        isReadonly: json.isReadonly || false,
        icon: json.icon || null,
      };
    });

    return notes;
  }
}
