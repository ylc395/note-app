import type { FileRepository, FilePatch, Query } from '#domain/server/repository/fileRepository.js';
import type { File, FileTextRecord } from '#domain/server/model/file.js';

import BaseRepository from './BaseRepository.js';
import { tableName as fileTableName, type Row } from '../schema/file.js';
import { tableName as fileTextTableName } from '../schema/fileText.js';
import { toArrayBuffer } from '#utils/file.js';

export default class SqliteFileRepository extends BaseRepository implements FileRepository {
  public async findAllFileTextRecords(ids: File['id'][]) {
    const rows = await this.db
      .selectFrom(fileTextTableName)
      .select(['fileId', 'location', 'text'])
      .where('fileId', 'in', ids)
      .execute();

    return rows;
  }

  public async findOneById(id: string) {
    const existedFile = await this.db
      .selectFrom(fileTableName)
      .select(['id', 'lang', 'mimeType', 'size', 'hash', 'isTemp'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existedFile) {
      return null;
    }

    return SqliteFileRepository.rowToFileVO(existedFile);
  }

  public readonly findBlobById = async (id: string) => {
    const row = await this.db.selectFrom(fileTableName).select(['data']).where('id', '=', id).executeTakeFirst();
    return row ? SqliteFileRepository.getBlob(row) : null;
  };

  public async findOneByHash(hash: string) {
    const existedFile = await this.db
      .selectFrom(fileTableName)
      .select(['id', 'lang', 'mimeType', 'size', 'hash', 'isTemp'])
      .where('hash', '=', hash)
      .executeTakeFirst();

    if (!existedFile) {
      return null;
    }

    return existedFile ? SqliteFileRepository.rowToFileVO(existedFile) : null;
  }

  public static getBlob(row: Pick<Row, 'data'>) {
    return toArrayBuffer(row.data);
  }

  public static rowToFileVO<T extends Pick<Row, 'isTemp'>>(row: T): T & { isTemp: boolean } {
    return { ...row, isTemp: Boolean(row.isTemp) };
  }

  public async create({ data, lang, isTemp, ...file }: File) {
    const row = await this.db
      .insertInto(fileTableName)
      .values({
        ...file,
        isTemp: isTemp ? 1 : 0,
        lang: JSON.stringify(lang),
        data: Buffer.from(data),
      })
      .returning(['id', 'lang', 'mimeType', 'size', 'hash', 'isTemp'])
      .executeTakeFirstOrThrow();

    return SqliteFileRepository.rowToFileVO(row);
  }

  public async createTextRecord({ location, ...record }: FileTextRecord) {
    await this.db
      .insertInto(fileTextTableName)
      .values({ location: JSON.stringify(location), ...record })
      .execute();
  }

  public async findUnfinishedFile() {
    const rows = await this.db
      .selectFrom(fileTableName)
      .select(['id', 'size', 'lang', 'mimeType', 'hash', 'isTemp'])
      .where((eb) => eb.and([eb(`${fileTableName}.textExtracted`, '=', 0), eb(`${fileTableName}.isTemp`, '=', 0)]))
      .execute();

    return rows.map(SqliteFileRepository.rowToFileVO);
  }

  public async updateOne(id: File['id'], patch: FilePatch) {
    const row = await this.db
      .updateTable(fileTableName)
      .where('id', '=', id)
      .set({
        lang: patch.lang ? JSON.stringify(patch.lang) : undefined,
        textExtracted: typeof patch.isTextExtracted === 'boolean' ? (patch.isTextExtracted ? 1 : 0) : undefined,
      })
      .executeTakeFirst();

    return Boolean(row.numUpdatedRows);
  }

  public async findAll(q: Query) {
    if (q.ids.length === 0) {
      return [];
    }

    const rows = await this.db
      .selectFrom(fileTableName)
      .select(['id', 'lang', 'mimeType', 'size', 'hash', 'isTemp'])
      .where('id', 'in', q.ids)
      .execute();

    return rows.map((row) => ({ ...row, isTemp: Boolean(row.isTemp) }));
  }

  public async removeOneById(id: File['id']) {
    await this.db.deleteFrom(fileTableName).where('id', '=', id).execute();
  }
}
