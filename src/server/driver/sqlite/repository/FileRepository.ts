import type { File } from 'model/File';
import type { FileRepository } from 'service/repository/FileRepository';

import db from '../db';
import { type Row as FileRow, tableName as filesTableName } from '../db/fileSchema';

export default class SqliteFileRepository implements FileRepository {
  async create(file: File) {
    const rows = await db
      .knex<FileRow>(filesTableName)
      .insert({ ...file, isTemp: file.isTemp ? 1 : 0 })
      .returning<Omit<FileRow, 'data'>[]>(['id', 'mimeType', 'deviceName', 'sourceUrl', 'createdAt']);

    return rows[0];
  }
}
