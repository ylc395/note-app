import { createHash } from 'node:crypto';
import pick from 'lodash/pick';

import type { FileRepository } from 'service/repository/FileRepository';
import type { File, FileText, FileVO } from 'model/file';

import BaseRepository from './BaseRepository';
import fileSchema, { type Row } from '../schema/file';
import fileTextSchema from '../schema/fileText';

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

  static getBlob(row: Pick<Row, 'data'>) {
    return (row.data as Uint8Array).buffer;
  }

  private async findOrCreate({ data, mimeType }: { data: ArrayBuffer; mimeType: string }) {
    const hash = createHash('md5').update(new Uint8Array(data)).digest('base64');
    const existedFile = await this.db.selectFrom(tableName).selectAll().where('hash', '=', hash).executeTakeFirst();

    if (existedFile) {
      return existedFile;
    }

    const buffer = Buffer.from(data);

    const createdFile = await this.createOne(tableName, {
      id: this.generateId(),
      hash,
      data: buffer,
      size: buffer.byteLength,
      mimeType,
    });

    return createdFile;
  }

  async batchCreate(files: File[]) {
    const rows: FileVO[] = [];

    for (const file of files) {
      const row = await this.findOrCreate(file);
      rows.push(row);
    }

    return rows.map((row) => pick(row, ['id', 'mimeType', 'size']));
  }

  async haveText(ids: FileVO['id'][]) {
    const counts = await this.db
      .selectFrom(fileTextSchema.tableName)
      .select((eb) => ['fileId', eb.fn.countAll().as('count')])
      .where('fileId', 'in', ids)
      .groupBy('fileId')
      .execute();

    return counts.reduce((result, { fileId, count }) => {
      result[fileId] = Boolean(count);
      return result;
    }, {} as Record<FileVO['id'], boolean>);
  }

  async createText({ fileId, records }: FileText) {
    await this.db
      .insertInto(fileTextSchema.tableName)
      .values(
        records.map(({ location: { page, ...info }, text }) => ({
          fileId,
          text,
          location: JSON.stringify(info),
          page: page || null,
        })),
      )
      .execute();
  }
}
