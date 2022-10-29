import type { TagDTO, TagTypes } from 'dto/Tag';
import type { TagRepository } from 'service/repository/TagRepository';
import { tableName, Row } from 'driver/sqlite/tagSchema';
import db from 'driver/sqlite';

export default class SqliteTagRepository implements TagRepository {
  async create(tag: TagDTO) {
    const rows = await db.knex<Row>(tableName).insert(tag).returning('id');
    return rows[0].id;
  }

  async getAll(type: TagTypes) {
    return await db.knex<Row>(tableName).where('type', type).select('id', 'name', 'parentId');
  }
}
