import pick from 'lodash/pick';
import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';

import type { TagDTO, TagPatchDTO, TagQuery, TagVO } from 'interface/Tag';
import type { TagRepository } from 'service/repository/TagRepository';
import { tableName, type Row } from 'driver/sqlite/tagSchema';
import { tableName as entityToTagTableName, type Row as EntityToTagRow } from 'driver/sqlite/materialToTagSchema';
import db from 'driver/sqlite';

export default class SqliteTagRepository implements TagRepository {
  async create(tag: TagDTO) {
    const rows = await db.knex<Row>(tableName).insert(tag).returning(['id', 'parentId', 'name']);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return rows[0]!;
  }

  async findAll(query: TagQuery) {
    const sqlQuery = db
      .knex<Row>(tableName)
      .select('id', 'name', 'parentId')
      .where(pick(query, ['name', 'parentId']));

    if (query.id) {
      sqlQuery.andWhere('id', Array.isArray(query.id) ? 'in' : '=', query.id);
    }

    return await sqlQuery;
  }

  async findOne(tagQuery: TagQuery) {
    if (isEmpty(tagQuery)) {
      throw new Error('empty query');
    }

    return (await this.findAll(tagQuery))[0];
  }

  async deleteOne(id: TagVO['id'], cascade: boolean) {
    const trx = await db.knex.transaction();
    let count = 0;

    try {
      const deletedIds: Row['id'][] = [id];
      const row = await trx<Row>(tableName).where({ id }).first();

      if (!row) {
        return count;
      }

      count += await trx<Row>(tableName).where({ id }).del();

      if (cascade) {
        let idsToDelete: Row['id'][];
        let parentIds = [id];

        do {
          idsToDelete = map(await trx<Row>(tableName).select('id').whereIn('parentId', parentIds), 'id');
          count += await trx<Row>(tableName).whereIn('id', idsToDelete).del();
          parentIds = idsToDelete;
          deletedIds.push(...idsToDelete);
        } while (idsToDelete.length > 0);
      } else {
        await trx<Row>(tableName).update({ parentId: row.parentId }).where({ parentId: id });
      }

      await trx<EntityToTagRow>(entityToTagTableName).whereIn('entityId', deletedIds).del();
      await trx.commit();
    } catch (error) {
      await trx.rollback(error);
      throw error;
    }

    return count;
  }

  async update(id: TagVO['id'], tagPatch: TagPatchDTO) {
    return await db.knex<Row>(tableName).update(tagPatch).where('id', id);
  }
}
