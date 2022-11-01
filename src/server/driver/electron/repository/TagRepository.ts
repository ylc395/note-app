import pick from 'lodash/pick';

import { type TagDTO, type TagQuery, TagTypes } from 'interface/Tag';
import type { TagRepository } from 'service/repository/TagRepository';
import { tableName, Row, TagTypes as RowTagTypes } from 'driver/sqlite/tagSchema';
import db from 'driver/sqlite';

const TYPES_MAP: Record<TagTypes, RowTagTypes> = {
  [TagTypes.Material]: RowTagTypes.Material,
};

export default class SqliteTagRepository implements TagRepository {
  async create(tag: TagDTO) {
    const rows = await db
      .knex<Row>(tableName)
      .insert({ ...tag, type: TYPES_MAP[tag.type] })
      .returning(['id', 'parentId', 'name']);

    return rows[0];
  }

  async findAll(query: TagQuery) {
    const sqlQuery = db
      .knex<Row>(tableName)
      .select('id', 'name', 'parentId')
      .where(pick(query, ['name', 'parentId']));

    if (query.type) {
      sqlQuery.andWhere('type', TYPES_MAP[query.type]);
    }

    if (query.id) {
      sqlQuery.andWhere('id', Array.isArray(query.id) ? 'in' : '=', query.id);
    }

    return await sqlQuery;
  }
}
