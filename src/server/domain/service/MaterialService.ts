import { Injectable, Inject } from '@nestjs/common';
import { type FileReader, token as fileReaderToken } from 'infra/FileReader';
import { type Database, token as databaseToken } from 'infra/Database';
import { type LocalClient, token as localClientToken } from 'infra/LocalClient';
import type { Material } from 'model/Material';

@Injectable()
export default class MaterialService {
  constructor(
    @Inject(fileReaderToken) private readonly fileReader: FileReader,
    @Inject(databaseToken) private readonly db: Database,
    @Inject(localClientToken) private readonly localClient?: LocalClient,
  ) {}

  async create(materials: Partial<Material>[]) {
    const deviceName = this.localClient?.getDeviceName();
    const files = await Promise.all(
      materials.map(async ({ sourceUrl, mimeType }) => {
        const path = sourceUrl?.match(/^file:\/\/(.+)/)?.[1];

        if (!path) {
          throw new Error('invalid sourceUrl');
        }

        const { data, name, hash } = await this.fileReader.read(path);

        return { data, name, mimeType, deviceName, sourceUrl, hash };
      }),
    );

    const fileRecords: { id: number; name: string }[] = await this.db
      .knex('files')
      .returning(['id', 'name'])
      .insert(files);
    await this.db.knex('materials').insert(fileRecords.map(({ id, name }) => ({ fileId: id, name })));
  }
}
