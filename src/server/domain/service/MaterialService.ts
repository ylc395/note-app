import { Injectable, Inject } from '@nestjs/common';
import { type FileReader, token as fileReaderToken } from 'infra/FileReader';
import { type Database, token as databaseToken } from 'infra/Database';
import { type LocalClient, token as localClientToken } from 'infra/LocalClient';
import { type Material, type RawMaterial, UNKNOWN_MIME_TYPE } from 'model/Material';

@Injectable()
export default class MaterialService {
  constructor(
    @Inject(fileReaderToken) private readonly fileReader: FileReader,
    @Inject(databaseToken) private readonly db: Database,
    @Inject(localClientToken) private readonly localClient?: LocalClient,
  ) {}

  async create(files: RawMaterial[]) {
    const materials = await Promise.all(
      files.map(async ({ url, mimeType, deviceName }) => {
        const path = url.match(/^file:\/\/(.+)/)?.[0];

        if (!path) {
          throw new Error('invalid path');
        }

        const { data, name } = await this.fileReader.read(path);
        const material: Material = {
          data,
          name,
          mimeType: mimeType || UNKNOWN_MIME_TYPE,
          sourceUrl: url,
          deviceName: deviceName || this.localClient?.getDeviceName(),
        };

        return material;
      }),
    );

    await this.db.knex.insert(materials).into('materials');
  }
}
