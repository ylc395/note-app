import type { MaterialRepository, Directory } from 'service/repository/MaterialRepository';
import type { DirectoryVO, EntityMaterialVO, MaterialDTO, MaterialQuery } from 'interface/material';
import pick from 'lodash/pick';

import schema, { type Row } from '../schema/material';
import BaseRepository from './BaseRepository';
import FileRepository from './FileRepository';

export default class SqliteMaterialRepository extends BaseRepository<Row> implements MaterialRepository {
  protected readonly schema = schema;
  private readonly files = new FileRepository(this.knex);
  async createDirectory(directory: Directory) {
    const createdRow = await this.createOrUpdate(directory);
    return SqliteMaterialRepository.rowToDirectory(createdRow);
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

    return SqliteMaterialRepository.rowToMaterial(createdMaterial, file.mimeType);
  }

  private static rowToDirectory(row: Row): DirectoryVO {
    return {
      id: String(row.id),
      name: row.name,
      icon: row.icon,
      parentId: row.parentId ? String(row.parentId) : null,
      childrenCount: 0,
    };
  }

  private static rowToMaterial(row: Row, mimeType: string): EntityMaterialVO {
    return {
      ...pick(row, ['name', 'icon', 'sourceUrl', 'createdAt', 'updatedAt']),
      id: String(row.id),
      parentId: row.parentId ? String(row.parentId) : null,
      mimeType: mimeType,
    };
  }

  private async getChildrenCounts(ids: Row['id'][]) {
    const childrenCount = await this.knex(this.schema.tableName)
      .whereIn('parentId', ids)
      .groupBy('parentId')
      .select(this.knex.raw('count(*) as childrenCount'), 'parentId');

    return childrenCount.reduce((result, { parentId, childrenCount }) => {
      result[parentId] = childrenCount;
      return result;
    }, {} as Record<string, number>);
  }

  async findAll(query: MaterialQuery) {
    const sql = query.parentId
      ? this.knex<Row>(this.schema.tableName).where('parentId', query.parentId)
      : this.knex<Row>(this.schema.tableName).whereNull('parentId');

    const rows = await sql
      .leftJoin(this.files.tableName, `${this.schema.tableName}.fileId`, `${this.files.tableName}.id`)
      .select(`${this.files.tableName}.mimeType`, this.knex.raw(`${this.schema.tableName}.*`));

    const directories: DirectoryVO[] = [];
    const materials: EntityMaterialVO[] = [];

    for (const row of rows) {
      if (!row.fileId) {
        directories.push(SqliteMaterialRepository.rowToDirectory(row));
      } else {
        materials.push(SqliteMaterialRepository.rowToMaterial(row, row.mimeType));
      }
    }

    const childrenCounts = await this.getChildrenCounts(directories.map(({ id }) => Number(id)));
    console.log(childrenCounts);

    for (const directory of directories) {
      directory.childrenCount = childrenCounts[directory.id] || 0;
    }

    return [...directories, ...materials];
  }
}
