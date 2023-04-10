import type { MaterialRepository, Directory } from 'service/repository/MaterialRepository';
import type { MaterialDTO } from 'interface/material';

import schema, { type Row, MaterialTypes } from '../schema/material';
import BaseRepository from './BaseRepository';

export default class SqliteMaterialRepository extends BaseRepository<Row> implements MaterialRepository {
  protected readonly schema = schema;
  async createDirectory(directory: Directory) {
    const createdRow = await this.createOrUpdate({
      ...directory,
      type: MaterialTypes.Directory,
    });

    return {
      id: String(createdRow.id),
      name: createdRow.name,
      icon: createdRow.icon,
      parentId: createdRow.parentId ? String(createdRow.parentId) : null,
      childrenCount: 0,
    };
  }

  async createEntity(material: MaterialDTO) {
    return {
      id: '',
      name: '',
      icon: null,
      parentId: null,
      mimeType: '',
      sourceUrl: null,
      createdAt: 0,
      updatedAt: 0,
    };
  }
}
