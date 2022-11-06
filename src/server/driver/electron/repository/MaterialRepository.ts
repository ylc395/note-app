import map from 'lodash/map';
import pick from 'lodash/pick';
import omit from 'lodash/omit';

import type { AggregatedMaterialVO, MaterialDTO, MaterialQuery } from 'interface/Material';
import type { MaterialRepository } from 'service/repository/MaterialRepository';

import db from 'driver/sqlite';
import { type Row as MaterialRow, tableName as materialsTableName } from 'driver/sqlite/materialSchema';
import { type Row as FileRow, tableName as filesTableName } from 'driver/sqlite/fileSchema';
import { type Row as EntityToTagRow, tableName as entityToTagTableName } from 'driver/sqlite/entityToTagSchema';
import { tableName as tagsTableName, TagTypes } from 'driver/sqlite/tagSchema';

export default class SqliteMaterialRepository implements MaterialRepository {
  async create(materials: MaterialDTO[]) {
    let createdMaterials: MaterialRow[] = [];
    const trx = await db.knex.transaction();

    try {
      createdMaterials = await trx<MaterialRow>(materialsTableName)
        .insert(materials.map((v) => pick(v, ['name', 'fileId', 'comment', 'rating'])))
        .returning(db.knex.raw('*'));

      const materialToTagRecords = materials.flatMap(({ tags }, i) => {
        return tags ? tags.map((tagId) => ({ entityId: createdMaterials[i].id, tagId })) : [];
      });

      if (materialToTagRecords.length > 0) {
        await trx<EntityToTagRow>(entityToTagTableName).insert(materialToTagRecords);
      }
      await trx<FileRow>(filesTableName).whereIn('id', map(materials, 'fileId')).update('isTemp', 0);
      await trx.commit();

      return createdMaterials.map((material, i) => ({ ...material, tags: materials[i].tags || [] }));
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
        `${filesTableName}.id as fileId`,
        `${filesTableName}.mimeType`,
        `${filesTableName}.sourceUrl`,
        `${filesTableName}.deviceName`,
        db.knex.raw(`group_concat(${tagsTableName}.id) as tag_id`),
        db.knex.raw(`group_concat(${tagsTableName}.name) as tag_name`),
      )
      .from(materialsTableName)
      .join(filesTableName, `${filesTableName}.id`, '=', `${materialsTableName}.fileId`)
      .leftJoin(entityToTagTableName, `${materialsTableName}.id`, '=', `${entityToTagTableName}.entityId`)
      .leftJoin(tagsTableName, function () {
        this.on(`${materialsTableName}.id`, '=', `${entityToTagTableName}.entityId`);
        this.on(`${tagsTableName}.id`, '=', `${entityToTagTableName}.tagId`);
        this.on(`${tagsTableName}.type`, '=', db.knex.raw(TagTypes.Material));
      })
      .groupBy(`${materialsTableName}.id`);

    return rows.map((row) => {
      const tagIds = row.tagId?.split(',') || [];
      const tagNames = row.tagName?.split(',') || [];
      return {
        ...omit(row, ['tagId', 'tagName', 'fileId', 'mimeType', 'sourceUrl', 'deviceName']),
        file: { id: row.fileId, ...pick(row, ['sourceUrl', 'mimeType', 'deviceName']) },
        tags: tagIds.map((id: string, i: string) => ({ id, name: tagNames[i] })),
      };
    }) as AggregatedMaterialVO[];
  }
}
