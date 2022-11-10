import map from 'lodash/map';
import pick from 'lodash/pick';

import type { MaterialVO, MaterialDTO, MaterialQuery } from 'interface/Material';
import type { MaterialRepository } from 'service/repository/MaterialRepository';

import db from 'driver/sqlite';
import { type Row as MaterialRow, tableName as materialsTableName, MaterialTypes } from 'driver/sqlite/materialSchema';
import { type Row as FileRow, tableName as filesTableName } from 'driver/sqlite/fileSchema';
import { type Row as EntityToTagRow, tableName as entityToTagTableName } from 'driver/sqlite/materialToTagSchema';
import { tableName as tagsTableName } from 'driver/sqlite/tagSchema';

export default class SqliteMaterialRepository implements MaterialRepository {
  async create(materials: MaterialDTO[]) {
    let createdMaterials: MaterialRow[] = [];
    const trx = await db.knex.transaction();

    try {
      createdMaterials = await trx<MaterialRow>(materialsTableName)
        .insert(
          materials.map((v) => ({
            ...pick(v, ['name', 'comment', 'rating']),
            type: MaterialTypes.File,
            entityId: v.fileId,
          })),
        )
        .returning(db.knex.raw('*'));

      const materialToTagRecords = materials.flatMap(({ tags }, i) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return tags ? tags.map((tagId) => ({ entityId: createdMaterials[i]!.id, tagId })) : [];
      });

      if (materialToTagRecords.length > 0) {
        await trx<EntityToTagRow>(entityToTagTableName).insert(materialToTagRecords);
      }

      const fileIds = map(materials, 'fileId').filter((id) => typeof id !== 'undefined') as number[];

      if (fileIds.length > 0) {
        await trx<FileRow>(filesTableName).whereIn('id', fileIds).update('isTemp', 0);
      }

      await trx.commit();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return createdMaterials.map((material, i) => ({ ...material, tags: materials[i]!.tags || [] }));
    } catch (error) {
      await trx.rollback(error);
      throw error;
    }
  }

  async findAll(query: MaterialQuery) {
    const rows = await db.knex
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
        this.on(`${materialsTableName}.type`, '=', db.knex.raw('?', [MaterialTypes.File]));
        this.on(`${filesTableName}.id`, '=', `${materialsTableName}.entity_id`);
      })
      .leftJoin(entityToTagTableName, `${materialsTableName}.id`, '=', `${entityToTagTableName}.entityId`)
      .leftJoin(tagsTableName, `${tagsTableName}.id`, '=', `${entityToTagTableName}.tagId`)
      .groupBy(`${materialsTableName}.id`);

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
