import type { MaterialRepository, Directory } from 'service/repository/MaterialRepository';
import type { MaterialDTO } from 'interface/material';
import pick from 'lodash/pick';

import schema, { type Row } from '../schema/material';
import BaseRepository from './BaseRepository';
import FileRepository from './FileRepository';

export default class SqliteMaterialRepository extends BaseRepository<Row> implements MaterialRepository {
  protected readonly schema = schema;
  private readonly files = new FileRepository(this.knex);
  async createDirectory(directory: Directory) {
    const createdRow = await this.createOrUpdate(directory);

    return {
      id: String(createdRow.id),
      name: createdRow.name,
      icon: createdRow.icon,
      parentId: createdRow.parentId ? String(createdRow.parentId) : null,
      childrenCount: 0,
    };
  }

  async createEntity(material: MaterialDTO) {
    const file = await (material.text
      ? this.files.findOrCreate({ data: Buffer.from(material.text), mimeType: 'text/markdown' })
      : material.file
      ? this.files.findOrCreate({ data: material.file.data, mimeType: material.file.mimeType })
      : null);

    if (!file) {
      throw new Error('invalid material');
    }

    const createdMaterial = await this.createOrUpdate({
      ...material,
      fileId: file.id,
    });

    return {
      ...pick(createdMaterial, ['name', 'icon', 'sourceUrl', 'createdAt', 'updatedAt']),
      id: String(createdMaterial.id),
      parentId: createdMaterial.parentId ? String(createdMaterial.parentId) : null,
      mimeType: file.mimeType,
    };
  }
}
