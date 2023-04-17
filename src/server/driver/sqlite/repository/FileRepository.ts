import { createHash } from 'node:crypto';

import BaseRepository from './BaseRepository';
import fileSchema, { type Row } from '../schema/file';

export default class FileRepository extends BaseRepository<Row> {
  protected readonly schema = fileSchema;

  get tableName() {
    return this.schema.tableName;
  }
  async findOrCreate({ data, mimeType }: { data: ArrayBuffer; mimeType: string }) {
    const hash = createHash('md5').update(new Uint8Array(data)).digest('base64');
    const existedFile = await this.knex<Row>(this.schema.tableName).where({ hash }).first();

    if (existedFile) {
      return existedFile;
    }

    const createdFile = await this._createOrUpdate({
      hash,
      data: Buffer.from(data),
      size: data.byteLength,
      mimeType,
    });

    return createdFile;
  }
}
