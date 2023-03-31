import { createHash } from 'node:crypto';
import compact from 'lodash/compact';

import type { FileRepository, RawFile, FileQuery } from 'service/repository/FileRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/file';
import fileDataSchema, { type Row as FileDataRow } from '../schema/fileData';
import { buildIndex } from 'utils/collection';
import type { FileVO } from 'interface/file';

export default class SqliteFileRepository extends BaseRepository<Row> implements FileRepository {
  protected schema = schema;
  private fileDataSchema = fileDataSchema;

  async create(file: RawFile) {
    const hash = createHash('md5').update(new Uint8Array(file.data)).digest('base64');
    const existedFileData = await this.knex<FileDataRow>(this.fileDataSchema.tableName).where({ hash }).first('id');

    let fileDataId: FileDataRow['id'];

    if (existedFileData) {
      fileDataId = existedFileData.id;
    } else {
      const createdFileDataId = (
        await this.knex<FileDataRow>(this.fileDataSchema.tableName)
          .insert({
            hash,
            data: Buffer.from(file.data),
            size: file.data.byteLength,
            mimeType: file.mimeType,
          })
          .returning('id')
      )[0]?.id;

      if (!createdFileDataId) {
        throw new Error('create file data failed');
      }

      fileDataId = createdFileDataId;
    }

    const createdFileId = (
      await this.knex<Row>(this.schema.tableName)
        .insert({
          name: file.name,
          sourceUrl: file.sourceUrl,
          fileDataId,
        })
        .returning('id')
    )[0]?.id;

    if (!createdFileId) {
      throw new Error('fail to create file');
    }

    return (await this.findAll({ id: [createdFileId] }))[0];
  }

  private getFindSql(fields?: string[]) {
    return this.knex(this.schema.tableName)
      .select(fields || [`${this.schema.tableName}.id`, 'name', 'sourceUrl', 'mimeType', 'createdAt', 'size'])
      .join(
        this.fileDataSchema.tableName,
        `${this.schema.tableName}.fileDataId`,
        `${this.fileDataSchema.tableName}.id`,
      );
  }

  async findAll(query: FileQuery | { id: Row['id'][] }) {
    const sql = this.getFindSql();

    if ('id' in query) {
      sql.whereIn(`${this.schema.tableName}.id`, query.id);
    }

    if ('sourceUrl' in query) {
      sql.whereIn(`${this.schema.tableName}.sourceUrl`, query.sourceUrl);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await sql).map((row: any) => ({ ...row, id: String(row.id) }));
  }

  async batchCreate(files: RawFile[]) {
    const hashes = files.map((file) => createHash('md5').update(new Uint8Array(file.data)).digest('base64'));
    const existedFileDataRows = buildIndex(
      await this.knex<FileDataRow>(this.fileDataSchema.tableName).whereIn('hash', hashes).select('id', 'hash'),
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
        ? buildIndex(
            await this.knex<FileDataRow>(this.fileDataSchema.tableName)
              .insert(fileDataRowsToInsert)
              .returning(['id', 'hash']),
            'hash',
          )
        : {};

    const createdRows = await this.knex(this.schema.tableName)
      .insert(
        files.map((file, index) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const hash = hashes[index]!;
          const fileDataId = (existedFileDataRows[hash] || createdFileDataRows[hash])?.id;

          if (!fileDataId) {
            throw new Error('no file data id');
          }

          return {
            name: file.name,
            sourceUrl: file.sourceUrl,
            fileDataId,
          };
        }),
      )
      .returning('id');

    return this.findAll({ id: createdRows.map(({ id }) => id) });
  }

  async findOneById(id: FileVO['id']) {
    return (await this.getFindSql().where(`${this.schema.tableName}.id`, id).first()) || null;
  }

  async findFileDataById(id: FileVO['id']) {
    const row = (await this.getFindSql(['mimeType', 'data']).where(`${this.schema.tableName}.id`, id).first()) || null;

    if (row) {
      row.data = row.data.buffer;
    }

    return row;
  }
}
