import { createHash } from 'node:crypto';
import { pick } from 'lodash-es';
import { sql } from 'kysely';

import type { FileRepository } from '@domain/service/repository/FileRepository.js';
import type { LoadedFile, FileText, FileVO } from '@domain/model/file.js';

import BaseRepository from './BaseRepository.js';
import { tableName as fileTableName, type Row } from '../schema/file.js';
import { tableName as fileTextTableName } from '../schema/fileText.js';

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

  private async findOrCreate({ data, ...file }: Required<LoadedFile>) {
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
      ...file,
    });

    return createdFile;
  }

  async create(file: Required<LoadedFile>) {
    const row = await this.findOrCreate(file);
    return pick(row, ['id', 'mimeType', 'size', 'lang']);
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
        `${fileTableName}.lang`,
        sql<string>`group_concat(${sql.ref(`${fileTextTableName}.page`)})`.as('pages'),
      ])
      .where(`${fileTableName}.textExtracted`, '=', 0)
      .where(`${fileTableName}.mimeType`, 'in', mimeTypes)
      .groupBy(`${fileTableName}.id`)
      .execute();

    return rows.map(({ pages, ...row }) => ({ ...row, finished: pages.split(',').map(Number) }));
  }
}
