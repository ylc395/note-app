import map from 'lodash/map';

import type { MaterialDTO } from 'dto/Material';
import type { MaterialRepository } from 'service/repository/MaterialRepository';

import db from '../db';
import { type Row as MaterialRow, tableName as materialsTableName } from '../db/materialSchema';
import { type Row as FileRow, tableName as filesTableName } from '../db/fileSchema';

export default class SqliteMaterialRepository implements MaterialRepository {
  async create(materials: MaterialDTO[]) {
    let createdMaterials: MaterialRow[] = [];
    const trx = await db.knex.transaction();

    try {
      createdMaterials = await trx<MaterialRow>(materialsTableName).insert(materials).returning(db.knex.raw('*'));
      await trx<FileRow>(filesTableName).whereIn('id', map(materials, 'fileId')).update('isTemp', 0);
      await trx.commit();
    } catch (error) {
      await trx.rollback(error);
    }

    return createdMaterials;
  }
}
