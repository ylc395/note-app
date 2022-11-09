import pick from 'lodash/pick';
import map from 'lodash/map';

import { type TagDTO, type TagQuery, TagTypes, TagVO } from 'interface/Tag';
import type { TagRepository } from 'service/repository/TagRepository';
import { tableName, type Row, TagTypes as RowTagTypes } from 'driver/sqlite/tagSchema';
import { tableName as entityToTagTableName, type Row as EntityToTagRow } from 'driver/sqlite/entityToTagSchema';
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return rows[0]!;
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

  async deleteOne(id: TagVO['id'], cascade: boolean) {
    const trx = await db.knex.transaction();

    try {
      const deletedIds: Row['id'][] = [id];
      const row = await trx<Row>(tableName).where({ id }).first();

      if (!row) {
        return;
      }

      await trx<Row>(tableName).where({ id }).del();

      if (cascade) {
        let idsToDelete: Row['id'][];
        let parentIds = [id];

        do {
          idsToDelete = map(await trx<Row>(tableName).select('id').whereIn('parentId', parentIds), 'id');
          await trx<Row>(tableName).whereIn('id', idsToDelete).del();
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
  }
}
