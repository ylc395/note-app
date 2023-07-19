import { createHash } from 'node:crypto';

import BaseRepository from './BaseRepository';
import fileSchema, { type Row } from '../schema/file';

export default class FileRepository extends BaseRepository {
  protected readonly schema = fileSchema;

  get tableName() {
    return this.schema.tableName;
  }

  async findOneById(id: string) {
    const existedFile = await this.db.selectFrom(this.tableName).selectAll().where('id', '=', id).executeTakeFirst();
    return existedFile || null;
  }

  async findOrCreate({ data, mimeType }: { data: ArrayBuffer; mimeType: string }) {
    const hash = createHash('md5').update(new Uint8Array(data)).digest('base64');
    const existedFile = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('hash', '=', hash)
      .executeTakeFirst();

    if (existedFile) {
      return existedFile;
    }

    const createdFile = await this.createOne(this.tableName, {
      id: this.generateId(),
      hash,
      data: Buffer.from(data),
      size: data.byteLength,
      mimeType,
    });

    return createdFile;
  }

  async updateText(fileId: Row['id'], text: string) {
    return await this.updateOne(this.schema.tableName, fileId, { text });
  }
}
