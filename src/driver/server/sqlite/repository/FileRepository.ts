import type { FileRepository, FilePatch, Query } from '#domain/server/repository/fileRepository.js';
import type { File, FileTextRecord } from '#domain/server/model/file.js';

import { toArrayBuffer } from '#utils/file.js';
import type { MaybeArray } from '#utils/collection.js';

import BaseRepository from './BaseRepository.js';
import { tableName as fileTableName, type Row } from '../schema/file.js';
import { tableName as fileTextTableName } from '../schema/fileText.js';

export default class SqliteFileRepository extends BaseRepository implements FileRepository {
  public async findAllFileTextRecords(ids: MaybeArray<File['id']>) {
    const rows = await this.db
      .selectFrom(fileTextTableName)
      .select(['fileId', 'location', 'text'])
      .where('fileId', Array.isArray(ids) ? 'in' : '=', ids)
      .execute();

    return rows;
  }

  public async findOneById(id: string) {
    const existedFile = await this.db
      .selectFrom(fileTableName)
      .select(['id', 'lang', 'mimeType', 'size', 'hash'])
      .where('id', '=', id)
      .executeTakeFirst();

    return existedFile || null;
  }

  public readonly findBlobById = async (id: string) => {
    const row = await this.db.selectFrom(fileTableName).select(['data']).where('id', '=', id).executeTakeFirst();
    return row ? SqliteFileRepository.getBlob(row) : null;
  };

  public async findOneByHash(hash: string) {
    const existedFile = await this.db
      .selectFrom(fileTableName)
      .select(['id', 'lang', 'mimeType', 'size', 'hash'])
      .where('hash', '=', hash)
      .executeTakeFirst();

    return existedFile || null;
  }

  public static getBlob(row: Pick<Row, 'data'>) {
    return toArrayBuffer(row.data);
  }

  public async create({ data, lang, ...file }: Required<File>) {
    const row = await this.db
      .insertInto(fileTableName)
      .values({
        ...file,
        lang: JSON.stringify(lang),
        data: Buffer.from(data),
      })
      .returning(['id', 'lang', 'mimeType', 'size', 'hash'])
      .executeTakeFirstOrThrow();

    return row;
  }

  public async createTextRecord(record: FileTextRecord) {
    await this.db
      .insertInto(fileTextTableName)
      .values({ ...record, location: JSON.stringify(record.location) })
      .execute();
  }

  public async findUnfinishedFile(mimeTypes: string[]) {
    const rows = await this.db
      .selectFrom(fileTableName)
      .leftJoin(fileTextTableName, `${fileTableName}.id`, `${fileTextTableName}.fileId`)
      .select(['id', 'size', 'lang', 'mimeType', 'hash'])
      .groupBy('fileId')
      .where('mimeType', 'in', mimeTypes)
      .havingRef((eb) => eb.fn.count('location'), '<', `${fileTableName}.textUnitLength`)
      .execute();

    return rows;
  }

  public async updateOne(id: File['id'], patch: FilePatch) {
    const row = await this.db
      .updateTable(fileTableName)
      .where('id', '=', id)
      .set({ lang: patch.lang ? JSON.stringify(patch.lang) : undefined })
      .executeTakeFirst();

    return Boolean(row.numUpdatedRows);
  }

  public async findAll(q: Query) {
    if (q.ids.length === 0) {
      return [];
    }

    const rows = await this.db
      .selectFrom(fileTableName)
      .select(['id', 'lang', 'mimeType', 'size', 'hash'])
      .where('id', 'in', q.ids)
      .execute();

    return rows;
  }

  public async removeOneById(id: File['id']) {
    await this.db.deleteFrom(fileTableName).where('id', '=', id).execute();
  }
}
