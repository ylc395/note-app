import { createHash } from 'node:crypto';
import compact from 'lodash/compact';

import type { File } from 'model/file';
import type { ResourceRepository, FileQuery } from 'service/repository/ResourceRepository';
import type { ResourceVO } from 'interface/resource';
import { buildIndex } from 'utils/collection';

import BaseRepository from './BaseRepository';
import FileRepository from './FileRepository';
import schema, { type Row } from '../schema/resource';
import fileSchema, { type Row as FileRow } from '../schema/file';

export default class SqliteFileRepository extends BaseRepository<Row> implements ResourceRepository {
  protected readonly schema = schema;
  private readonly fileSchema = fileSchema;

  private readonly files = new FileRepository(this.db);

  async create(file: File) {
    const existedFileData = await this.files.findOrCreate(file);
    const fileId = existedFileData.id;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return (await this.findAll({ id: [fileId] }))[0]!;
  }

  private getFindSql() {
    return this.db
      .selectFrom(this.schema.tableName)
      .innerJoin(this.fileSchema.tableName, `${this.schema.tableName}.fileId`, `${this.fileSchema.tableName}.id`)
      .select([`${this.schema.tableName}.id`, 'name', 'sourceUrl', 'mimeType', 'createdAt', 'size']);
  }

  async findAll(query: FileQuery | { id: Row['id'][] }) {
    const sql = this.getFindSql();

    if ('id' in query) {
      sql.where(`${this.schema.tableName}.id`, 'in', query.id);
    }

    if ('sourceUrl' in query) {
      sql.where(`${this.schema.tableName}.sourceUrl`, 'in', query.sourceUrl);
    }

    return await sql.execute();
  }

  async batchCreate(files: File[]) {
    const hashes = files.map((file) => createHash('md5').update(new Uint8Array(file.data)).digest('base64'));
    const existedFileDataRows = buildIndex(
      await this.db.selectFrom(this.fileSchema.tableName).where('hash', 'in', hashes).select(['id', 'hash']).execute(),
      'hash',
    );

    const fileDataRowsToInsert = compact(
      files.map((file, index) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const hash = hashes[index]!;

        if (existedFileDataRows[hash]) {
          return null;
        }

        return {
          data: Buffer.from(file.data),
          mimeType: file.mimeType,
          size: file.data.byteLength,
          hash,
        };
      }),
    );

    const createdFileDataRows =
      fileDataRowsToInsert.length > 0
        ? buildIndex(await this._batchCreate<FileRow>(fileDataRowsToInsert, this.fileSchema.tableName), 'hash')
        : {};

    const createdRows = await this._batchCreate(
      files.map((file, index) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const hash = hashes[index]!;
        const fileId = (existedFileDataRows[hash] || createdFileDataRows[hash])?.id;

        if (!fileId) {
          throw new Error('no file data id');
        }

        return {
          name: file.name,
          sourceUrl: file.sourceUrl,
          fileId,
        };
      }),
    );

    return this.findAll({ id: createdRows.map(({ id }) => id) });
  }

  async findOneById(id: ResourceVO['id']) {
    return (await this.getFindSql().where(`${this.schema.tableName}.id`, '=', id).executeTakeFirst()) || null;
  }

  async findFileById(id: ResourceVO['id']) {
    const row =
      (await this.getFindSql()
        .select(['mimeType', 'data'])
        .where(`${this.schema.tableName}.id`, '=', id)
        .executeTakeFirst()) || null;

    if (row) {
      return { ...row, data: (row.data as Uint16Array).buffer };
    }

    return null;
  }
}
