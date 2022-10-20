import type { File } from 'model/Material';
import type { MaterialRepository } from 'service/repository/MaterialRepository';

import db from '../db';
import type { Row as MaterialRow } from '../db/materialSchema';
import type { Row as FileRow } from '../db/fileSchema';

export default class SqliteMaterialRepository implements MaterialRepository {
  async createByFiles(files: File[]) {
    const createdFiles = await db.knex<FileRow>('files').insert(files).returning(['id', 'name']);

    const createdMaterial = await db
      .knex<MaterialRow>('materials')
      .insert(createdFiles.map(({ id, name }) => ({ fileId: id, name })))
      .returning<Omit<MaterialRow, 'file_id'>[]>(['id', 'name', 'comment', 'rating', 'created_at', 'updated_at']);

    return createdMaterial;
  }
}
