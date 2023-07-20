import { createHash } from 'node:crypto';
import pick from 'lodash/pick';

import type { FileRepository } from 'service/repository/FileRepository';
import type { File } from 'model/file';

import BaseRepository from './BaseRepository';
import fileSchema, { type Row } from '../schema/file';

const { tableName } = fileSchema;

export default class SqliteFileRepository extends BaseRepository implements FileRepository {
  async findOneById(id: string) {
    const existedFile = await this.db.selectFrom(tableName).selectAll().where('id', '=', id).executeTakeFirst();
    return existedFile || null;
  }

  async findBlobById(id: string) {
    const row = await this.db
      .selectFrom(tableName)
      .select(['data', 'mimeType'])
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? SqliteFileRepository.getBlob(row) : null;
  }

  static getBlob(row: Pick<Row, 'mimeType' | 'data'>) {
    if (row.mimeType.startsWith('text')) {
      return (row.data as Uint8Array).toString();
    }
    return (row.data as Uint8Array).buffer;
  }

  async findOrCreate({ data, mimeType }: { data: ArrayBuffer; mimeType: string }) {
    const hash = createHash('md5').update(new Uint8Array(data)).digest('base64');
    const existedFile = await this.db.selectFrom(tableName).selectAll().where('hash', '=', hash).executeTakeFirst();

    if (existedFile) {
      return existedFile;
    }

    const createdFile = await this.createOne(tableName, {
      id: this.generateId(),
      hash,
      data: Buffer.from(data),
      size: data.byteLength,
      mimeType,
    });

    return createdFile;
  }

  async batchCreate(files: File[]) {
    const rows = await Promise.all(files.map((file) => this.findOrCreate(file)));

    return rows.map((row) => pick(row, ['id', 'mimeType', 'size']));
  }

  async updateText(fileId: Row['id'], text: string) {
    return await this.updateOne(tableName, fileId, { text });
  }
}
