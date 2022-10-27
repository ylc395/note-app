import type { File } from 'model/File';
import type { FileRepository } from 'service/repository/FileRepository';

import db from '../db';
import { type Row as FileRow, tableName as filesTableName } from '../db/fileSchema';

export default class SqliteFileRepository implements FileRepository {
  async create(file: Partial<File>) {
    const rows = await db
      .knex<FileRow>(filesTableName)
      .insert(file)
      .returning<Omit<FileRow, 'data'>[]>(['id', 'mime_type', 'device_name', 'source_url', 'hash', 'created_at']);

    return rows[0];
  }
}
