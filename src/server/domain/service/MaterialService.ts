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

  async create({ path, mimeType }: MaterialFile) {
    const { data, name } = await this.fileReader.read(path);
    const material: Material = { file: data, type: mimeType, name };

    await this.db.knex.insert(material).into('materials');
  }
}
