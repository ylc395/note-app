import map from 'lodash/map';
import pick from 'lodash/pick';

import type { MaterialDTO, MaterialQuery } from 'interface/Material';
import type { MaterialRepository } from 'service/repository/MaterialRepository';

import db from 'driver/sqlite';
import { type Row as MaterialRow, tableName as materialsTableName } from 'driver/sqlite/materialSchema';
import { type Row as FileRow, tableName as filesTableName } from 'driver/sqlite/fileSchema';
import { type Row as EntityToTagRow, tableName as entityToTagTableName } from 'driver/sqlite/entityToTagSchema';

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
    return (
      await db
        .knex<MaterialRow>(materialsTableName)
        .select('id', 'fileId', 'comment', 'name', 'rating', 'createdAt', 'updatedAt')
    ).map((m) => ({ ...m, tags: [] }));
  }
}
