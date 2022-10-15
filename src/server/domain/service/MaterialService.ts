import { Injectable, Inject } from '@nestjs/common';
import { type FileReader, token as fileReaderToken } from 'service/infra/FileReader';
import { type Database, token as databaseToken } from 'service/infra/Database';
import type { Material, MaterialFile } from 'model/Material';

@Injectable()
export default class MaterialService {
  constructor(
    @Inject(fileReaderToken) private readonly fileReader: FileReader,
    @Inject(databaseToken) private readonly db: Database,
  ) {}

  async create(files: MaterialFile[]) {
    const materials = await Promise.all(
      files.map(async ({ path, mimeType }) => {
        const { data, name } = await this.fileReader.read(path);
        const material: Material = { data, mimeType, name };

        return material;
      }),
    );

    await this.db.knex.insert(materials).into('materials');
  }
}
