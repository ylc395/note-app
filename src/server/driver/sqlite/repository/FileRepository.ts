import { compact, first, groupBy, pick } from 'lodash-es';

import type { FileRepository } from '@domain/service/repository/FileRepository.js';
import type { File, FileVO, NewFileTextRecord } from '@domain/model/file.js';

import BaseRepository from './BaseRepository.js';
import { tableName as fileTableName, type Row } from '../schema/file.js';
import { tableName as fileTextTableName } from '../schema/fileText.js';

export default class SqliteFileRepository extends BaseRepository implements FileRepository {
  public async findOneById(id: string) {
    const existedFile = await this.db.selectFrom(fileTableName).selectAll().where('id', '=', id).executeTakeFirst();
    return existedFile || null;
  }

  public readonly findBlobById = async (id: string) => {
    const row = await this.db
      .selectFrom(fileTableName)
      .select(['data', 'mimeType'])
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? SqliteFileRepository.getBlob(row) : null;
  };

  public async findOneByHash(hash: string) {
    const existedFile = await this.db.selectFrom(fileTableName).selectAll().where('hash', '=', hash).executeTakeFirst();
    return existedFile || null;
  }

  public static getBlob(row: Pick<Row, 'data'>) {
    return (row.data as Uint8Array).buffer;
  }

  public async create(file: File) {
    const row = await this.createOneOn(fileTableName, { ...file, id: this.generateId() });
    return pick(row, ['id', 'mimeType', 'size', 'lang']);
  }

  public async createText({ location, ...fileText }: NewFileTextRecord) {
    await this.db
      .insertInto(fileTextTableName)
      .values({ location: JSON.stringify(location), ...fileText })
      .execute();
  }

  public async markTextExtracted(fileId: FileVO['id']) {
    await this.db.updateTable(fileTableName).set({ textExtracted: 1 }).where('id', '=', fileId).execute();
  }

  public async findTextExtractedLocationOfUnfinished() {
    const rows = await this.db
      .selectFrom(fileTableName)
      .leftJoin(fileTextTableName, `${fileTableName}.id`, `${fileTextTableName}.fileId`)
      .select([
        `${fileTableName}.id as fileId`,
        `${fileTableName}.lang`,
        `${fileTableName}.mimeType`,
        `${fileTableName}.createdAt as fileCreatedAt`,
        `${fileTextTableName}.location`,
      ])
      .where(`${fileTableName}.textExtracted`, '=', 0)
      .execute();

    const groups = groupBy(rows, 'fileId');

    return Object.values(groups).map((records) => {
      const { fileCreatedAt, fileId, lang, mimeType } = first(records)!;

      return {
        fileId,
        fileCreatedAt,
        lang,
        mimeType,
        locations: compact(records.map(({ location }) => location && JSON.parse(location))),
      };
    });
  }
}
