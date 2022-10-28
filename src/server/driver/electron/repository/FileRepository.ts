import type { File } from 'model/File';
import type { FileRepository, FileQuery } from 'service/repository/FileRepository';

import db from 'driver/sqlite';
import { type Row as FileRow, tableName as filesTableName, TempFlags } from 'driver/sqlite/fileSchema';

export default class SqliteFileRepository implements FileRepository {
  async create(file: File) {
    const rows = await db
      .knex<FileRow>(filesTableName)
      .insert({ ...file, isTemp: file.isTemp ? TempFlags.Yes : TempFlags.No })
      .returning(['id']);

    return rows[0].id;
  }

  async findOne(query: FileQuery) {
    const rows = await db
      .knex<FileRow>(filesTableName)
      .where(query)
      .select('id', 'sourceUrl', 'mimeType', 'deviceName', 'hash', 'isTemp');

    const result = rows[0];

    if (result) {
      return { ...result, isTemp: Boolean(result.isTemp) };
    }
  }

  async findData(query: FileQuery) {
    const rows = await db.knex<FileRow>(filesTableName).where(query).select('data');

    return rows[0]?.data;
  }

  async updateOcrResult(id: number, text: string) {
    await db.knex<FileRow>(filesTableName).where('id', id).update({ ocrResult: text });
  }
}
