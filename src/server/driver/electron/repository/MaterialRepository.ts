import map from 'lodash/map';

import type { MaterialDTO } from 'interface/Material';
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
      createdMaterials = await trx<MaterialRow>(materialsTableName).insert(materials).returning(db.knex.raw('*'));

      const materialToTagRecords = materials.flatMap(({ tags }, i) => {
        return tags ? tags.map((tagId) => ({ entityId: createdMaterials[i].id, tagId })) : [];
      });

      if (materialToTagRecords.length > 0) {
        await trx<EntityToTagRow>(entityToTagTableName).insert(materialToTagRecords);
      }
      await trx<FileRow>(filesTableName).whereIn('id', map(materials, 'fileId')).update('isTemp', 0);
      await trx.commit();

      return createdMaterials;
    } catch (error) {
      await trx.rollback(error);
      throw error;
    }
  }
}
