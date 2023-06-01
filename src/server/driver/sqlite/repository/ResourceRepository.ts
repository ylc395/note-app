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

  private readonly files = new FileRepository(this.knex);

  async create(file: File) {
    const existedFileData = await this.files.findOrCreate(file);
    const fileId = existedFileData.id;

    return (await this.findAll({ id: [fileId] }))[0];
  }

  private getFindSql(fields?: string[]) {
    return this.knex(this.schema.tableName)
      .select(fields || [`${this.schema.tableName}.id`, 'name', 'sourceUrl', 'mimeType', 'createdAt', 'size'])
      .join(this.fileSchema.tableName, `${this.schema.tableName}.fileId`, `${this.fileSchema.tableName}.id`);
  }

  async findAll(query: FileQuery | { id: Row['id'][] }) {
    const sql = this.getFindSql();

    if ('id' in query) {
      sql.whereIn(`${this.schema.tableName}.id`, query.id);
    }

    if ('sourceUrl' in query) {
      sql.whereIn(`${this.schema.tableName}.sourceUrl`, query.sourceUrl);
    }

    return await sql;
  }

  async batchCreate(files: File[]) {
    const hashes = files.map((file) => createHash('md5').update(new Uint8Array(file.data)).digest('base64'));
    const existedFileDataRows = buildIndex(
      await this.knex<FileRow>(this.fileSchema.tableName).whereIn('hash', hashes).select('id', 'hash'),
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
    return (await this.getFindSql().where(`${this.schema.tableName}.id`, id).first()) || null;
  }

  async findFileById(id: ResourceVO['id']) {
    const row = (await this.getFindSql(['mimeType', 'data']).where(`${this.schema.tableName}.id`, id).first()) || null;

    if (row) {
      row.data = row.data.buffer;
    }

    return row;
  }
}