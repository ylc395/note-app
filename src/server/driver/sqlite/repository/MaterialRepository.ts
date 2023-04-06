import type { MaterialRepository } from 'service/repository/MaterialRepository';
import { DIRECTORY_MIME_TYPE } from 'service/MaterialService';
import type { MaterialMetadata } from 'interface/material';

import schema, { type Row, MaterialTypes } from '../schema/material';
import BaseRepository from './BaseRepository';

export default class SqliteMaterialRepository extends BaseRepository<Row> implements MaterialRepository {
  protected readonly schema = schema;
  async create(material: Parameters<MaterialRepository['create']>[0]) {
    const createdRow = await this.createOrUpdate({
      ...material,
      type: material.mimeType === DIRECTORY_MIME_TYPE ? MaterialTypes.Directory : MaterialTypes.Text,
    });

    return SqliteMaterialRepository.rowToVO(createdRow);
  }

  private static rowToVO(row: Row): MaterialMetadata {
    return {
      ...row,
      parentId: row.parentId ? String(row.parentId) : null,
      id: String(row.id),
      mimeType: row.type === MaterialTypes.Directory ? 'directory' : '',
    };
  }
}
