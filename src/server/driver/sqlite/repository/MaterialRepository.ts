import omit from 'lodash/omit';

import type { Material } from 'model/Material';
import type { MaterialRepository } from 'service/repository/MaterialRepository';

import db from '../db';
import { type Row as MaterialRow, tableName as materialsTableName } from '../db/materialSchema';

export default class SqliteMaterialRepository implements MaterialRepository {
  async create(materials: Partial<Material>[]) {
    const materialRows: Partial<MaterialRow>[] = materials.map((m) => {
      if (!m.file?.id) {
        throw new Error('no file id');
      }

      return { ...omit(m, 'file'), fileId: m.file.id };
    });

    return await db
      .knex<MaterialRow>(materialsTableName)
      .insert(materialRows)
      .returning<MaterialRow[]>(db.knex.raw('*'));
  }
}
