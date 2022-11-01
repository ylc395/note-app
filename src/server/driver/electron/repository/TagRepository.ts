import { TagDTO, TagTypes } from 'interface/Tag';
import type { TagRepository } from 'service/repository/TagRepository';
import { tableName, Row, TagTypes as RowTagTypes } from 'driver/sqlite/tagSchema';
import db, { isQueryError, QueryErrorNos } from 'driver/sqlite';

const TYPES_MAP: Record<TagTypes, RowTagTypes> = {
  [TagTypes.Material]: RowTagTypes.Material,
};

export default class SqliteTagRepository implements TagRepository {
  async create(tag: TagDTO) {
    try {
      const rows = await db
        .knex<Row>(tableName)
        .insert({ ...tag, type: TYPES_MAP[tag.type] })
        .returning('id');
      return rows[0].id;
    } catch (e) {
      if (isQueryError(e) && e.errno === QueryErrorNos.CONSTRAINT) {
        throw new Error('标签名已存在');
      }

      throw e;
    }
  }

  async getAll(type: TagTypes) {
    return await db.knex<Row>(tableName).where('type', TYPES_MAP[type]).select('id', 'name', 'parentId');
  }
}
