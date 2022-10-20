import type { File } from 'model/Material';
import type { MaterialRepository } from 'service/repository/MaterialRepository';

import db from '../db';
import { type Row as MaterialRow, tableName as materialsTableName } from '../db/materialSchema';
import { type Row as FileRow, tableName as filesTableName } from '../db/fileSchema';

export default class SqliteMaterialRepository implements MaterialRepository {
  async createByFiles(files: File[]) {
    const transaction = await db.knex.transaction();
    let createdMaterial: Omit<MaterialRow, 'file_id'>[] = [];

    try {
      const createdFiles = await transaction<FileRow>(filesTableName).insert(files).returning(['id', 'name']);

      createdMaterial = await transaction<MaterialRow>(materialsTableName)
        .insert(createdFiles.map(({ id, name }) => ({ fileId: id, name })))
        .returning(['id', 'name', 'comment', 'rating', 'created_at', 'updated_at']);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback(error);
    }

    return createdMaterial;
  }
}
