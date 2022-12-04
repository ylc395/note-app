import map from 'lodash/map';
import pick from 'lodash/pick';
import compact from 'lodash/compact';

import type { MaterialVO, MaterialDTO, MaterialQuery } from 'interface/Material';
import type { MaterialRepository } from 'service/repository/MaterialRepository';

import db from 'driver/sqlite';
import { type Row as MaterialRow, tableName as materialsTableName } from 'driver/sqlite/materialSchema';
import { type Row as FileRow, tableName as filesTableName } from 'driver/sqlite/fileSchema';
import { type Row as EntityToTagRow, tableName as entityToTagTableName } from 'driver/sqlite/entityToTagSchema';
import { tableName as tagsTableName, Types } from 'driver/sqlite/tagSchema';

export default class SqliteMaterialRepository implements MaterialRepository {
  async create(materials: MaterialDTO[]) {
    let createdMaterials: Pick<MaterialRow, 'id'>[] = [];
    const trx = await db.knex.transaction();

    try {
      createdMaterials = await trx<MaterialRow>(materialsTableName)
        .insert(
          materials.map((v) => ({
            ...pick(v, ['name', 'comment', 'rating']),
            entityId: v.fileId,
          })),
        )
        .returning(['id']);

      const materialToTagRecords = materials.flatMap(({ tags }, i) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return tags ? tags.map((tagId) => ({ entityId: createdMaterials[i]!.id, tagId, type: Types.Material })) : [];
      });

      if (materialToTagRecords.length > 0) {
        await trx<EntityToTagRow>(entityToTagTableName).insert(materialToTagRecords);
      }

      const fileIds = compact(map(materials, 'fileId'));

      if (fileIds.length > 0) {
        await trx<FileRow>(filesTableName).whereIn('id', fileIds).update('isTemp', 0);
      }

      await trx.commit();

      return createdMaterials;
    } catch (error) {
      await trx.rollback(error);
      throw error;
    }
  }

  async deleteOne(id: number) {
    const trx = await db.knex.transaction();

    try {
      const rows = await trx
        .select(`${entityToTagTableName}.id as id`)
        .from(materialsTableName)
        .join(tagsTableName, `${tagsTableName}.id`, '=', String(Types.Material))
        .join(entityToTagTableName, function () {
          this.on(`${entityToTagTableName}.entityId`, '=', `${materialsTableName}.id`);
          this.on(`${entityToTagTableName}.tagId`, '=', `${tagsTableName}.id`);
        });

      await trx<EntityToTagRow>(entityToTagTableName).delete().whereIn('id', map(rows, 'id'));
      const count = await trx<MaterialRow>(materialsTableName).delete().where({ id });
      await trx.commit();

      return count;
    } catch (error) {
      await trx.rollback(error);
      throw error;
    }
  }

  async findAll(query: MaterialQuery) {
    const sqlQuery = db.knex
      .select(
        `${materialsTableName}.id`,
        `${materialsTableName}.name`,
        `${materialsTableName}.rating`,
        `${materialsTableName}.comment`,
        `${materialsTableName}.updatedAt`,
        `${materialsTableName}.createdAt`,
        `${filesTableName}.id as fileId`,
        `${filesTableName}.mimeType`,
        `${filesTableName}.sourceUrl`,
        `${filesTableName}.deviceName`,
        `${filesTableName}.size`,
        db.knex.raw(`group_concat(${tagsTableName}.id) as tag_id`),
        db.knex.raw(`group_concat(${tagsTableName}.name) as tag_name`),
      )
      .from(materialsTableName)
      .leftJoin(filesTableName, function () {
        this.on(`${filesTableName}.id`, '=', `${materialsTableName}.entity_id`);
      })
      .leftJoin(entityToTagTableName, `${materialsTableName}.id`, '=', `${entityToTagTableName}.entityId`)
      .leftJoin(tagsTableName, `${tagsTableName}.id`, '=', `${entityToTagTableName}.tagId`)
      .groupBy(`${materialsTableName}.id`);

    if (query.id) {
      sqlQuery.andWhere(`${materialsTableName}.id`, 'in', query.id);
    }

    const rows = await sqlQuery;
    return rows.map((row) => {
      const tagIds = row.tagId?.split(',').map(Number) || [];
      const tagNames = row.tagName?.split(',') || [];
      return {
        ...pick(row, ['id', 'name', 'comment', 'rating', 'updatedAt', 'createdAt']),
        file: { id: row.fileId, ...pick(row, ['sourceUrl', 'mimeType', 'deviceName', 'size']) },
        tags: tagIds.map((id: number, i: string) => ({ id, name: tagNames[i] })),
      };
    }) as MaterialVO[];
  }
}
