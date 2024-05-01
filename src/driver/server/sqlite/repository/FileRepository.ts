import { compact, first, groupBy } from 'lodash-es';

import type { FileRepository } from '@domain/server/service/repository/FileRepository.js';
import type { File, FileVO, NewFileTextRecord } from '@domain/server/model/file.js';

import BaseRepository from './BaseRepository.js';
import { tableName as fileTableName, type Row } from '../schema/file.js';
import { tableName as fileTextTableName } from '../schema/fileText.js';

export default class SqliteFileRepository extends BaseRepository implements FileRepository {
  public async findOneById(id: string) {
    const existedFile = await this.db.selectFrom(fileTableName).selectAll().where('id', '=', id).executeTakeFirst();

    if (!existedFile) {
      return null;
    }

    return { ...existedFile, lang: existedFile.lang.split(',') };
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

    if (!existedFile) {
      return null;
    }

    return { ...existedFile, lang: existedFile.lang.split(',') };
  }

  public static getBlob(row: Pick<Row, 'data'>) {
    return (row.data as Uint8Array).buffer;
  }

  public async create({ data, ...file }: File) {
    const row = await this.createOneOn(fileTableName, {
      ...file,
      lang: file.lang.join(','),
      data: Buffer.from(data),
      id: this.generateId(),
    });

    return { ...file, id: row.id };
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
        mimeType,
        lang: lang.split(','),
        locations: compact(records.map(({ location }) => location && JSON.parse(location))),
      };
    });
  }
}
