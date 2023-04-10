import { createHash } from 'node:crypto';

import BaseRepository from './BaseRepository';
import fileSchema, { type Row } from '../schema/file';

export default class FileRepository extends BaseRepository<Row> {
  protected readonly schema = fileSchema;
  async findOrCreate({ data, mimeType }: { data: ArrayBuffer; mimeType: string }) {
    const hash = createHash('md5').update(new Uint8Array(data)).digest('base64');
    const existedFile = await this.knex<Row>(this.schema.tableName).where({ hash }).first();

    if (existedFile) {
      return existedFile;
    }

    const createdFile = (await this.knex<Row>(this.schema.tableName)
      .insert({
        hash,
        data: Buffer.from(data),
        size: data.byteLength,
        mimeType,
      })
      .returning(this.knex.raw('*'))) as Row[];

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return createdFile[0]!;
  }
}
