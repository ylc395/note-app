import isEmpty from 'lodash/isEmpty';

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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return rows[0]!.id;
  }

  async findOne(query: FileQuery) {
    if (isEmpty(query)) {
      throw new Error('empty query');
    }

    const result = await db
      .knex<FileRow>(filesTableName)
      .where(query)
      .first('id', 'sourceUrl', 'mimeType', 'deviceName', 'hash', 'isTemp', 'size');

    if (result) {
      return { ...result, isTemp: Boolean(result.isTemp) };
    }
  }

  async findData(query: FileQuery) {
    const row = await db.knex<FileRow>(filesTableName).where(query).first('data');

    return row?.data;
  }

  async updateTextContent(id: number, text: string) {
    await db.knex<FileRow>(filesTableName).where('id', id).update({ textContent: text });
  }
}
