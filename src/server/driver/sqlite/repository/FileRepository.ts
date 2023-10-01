import { createHash } from 'node:crypto';
import pick from 'lodash/pick';

import type { FileRepository } from 'service/repository/FileRepository';
import type { File, FileText, FileVO } from 'model/file';

import BaseRepository from './BaseRepository';
import { tableName as fileTableName, type Row } from '../schema/file';
import { tableName as fileTextTableName } from '../schema/fileText';
import { sql } from 'kysely';

export default class SqliteFileRepository extends BaseRepository implements FileRepository {
  async findOneById(id: string) {
    const existedFile = await this.db.selectFrom(fileTableName).selectAll().where('id', '=', id).executeTakeFirst();
    return existedFile || null;
  }

  async findBlobById(id: string) {
    const row = await this.db
      .selectFrom(fileTableName)
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
    const existedFile = await this.db.selectFrom(fileTableName).selectAll().where('hash', '=', hash).executeTakeFirst();

    if (existedFile) {
      return existedFile;
    }

    const buffer = Buffer.from(data);

    const createdFile = await this.createOne(fileTableName, {
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
      .selectFrom(fileTextTableName)
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
      .insertInto(fileTextTableName)
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

  async markTextExtracted(fileId: FileVO['id']) {
    await this.db.updateTable(fileTableName).set({ textExtracted: 1 }).where('id', '=', fileId).execute();
  }

  async findTextUnextracted(mimeTypes: string[]) {
    const rows = await this.db
      .selectFrom(fileTableName)
      .leftJoin(fileTextTableName, `${fileTableName}.id`, `${fileTextTableName}.fileId`)
      .select([
        `${fileTableName}.id as fileId`,
        `${fileTableName}.mimeType`,
        sql<string>`group_concat(${sql.ref(`${fileTextTableName}.page`)})`.as('pages'),
      ])
      .where(`${fileTableName}.textExtracted`, '=', 0)
      .where(`${fileTableName}.mimeType`, 'in', mimeTypes)
      .groupBy(`${fileTableName}.id`)
      .execute();

    return rows.map(({ fileId, pages, mimeType }) => ({ fileId, mimeType, finished: pages.split(',').map(Number) }));
  }
}
