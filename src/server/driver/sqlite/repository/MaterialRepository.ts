import pick from 'lodash/pick';
import { readFile } from 'fs-extra';

import type { MaterialRepository, Directory } from 'service/repository/MaterialRepository';
import type { DirectoryVO, EntityMaterialVO, MaterialDTO, MaterialQuery, MaterialVO } from 'interface/material';

import schema, { type Row } from '../schema/material';
import type { Row as FileRow } from '../schema/file';
import BaseRepository from './BaseRepository';
import FileRepository from './FileRepository';
import MaterialAnnotationRepository from './MaterialAnnotationRepository';

export default class SqliteMaterialRepository extends BaseRepository<Row> implements MaterialRepository {
  protected readonly schema = schema;
  private readonly files = new FileRepository(this.knex);
  private readonly annotations = new MaterialAnnotationRepository(this.knex);
  async createDirectory(directory: Directory) {
    const createdRow = await this._createOrUpdate(directory);
    return SqliteMaterialRepository.rowToDirectory(createdRow);
  }

  async createEntity(material: MaterialDTO) {
    let file: FileRow | undefined;

    if (material.text) {
      file = await this.files.findOrCreate({ data: Buffer.from(material.text), mimeType: 'text/markdown' });
    }

    if (material.file && material.file.path) {
      const data = await readFile(material.file.path);
      file = await this.files.findOrCreate({ data, mimeType: material.file.mimeType });
    }

    if (!file) {
      throw new Error('invalid material');
    }

    const createdMaterial = await this._createOrUpdate({
      ...material,
      fileId: file.id,
    });

    return SqliteMaterialRepository.rowToMaterial(createdMaterial, file.mimeType);
  }

  private static rowToDirectory(row: Row, childrenCount = 0): DirectoryVO {
    return {
      ...pick(row, ['id', 'name', 'icon', 'parentId']),
      childrenCount,
    };
  }

  private static rowToMaterial(row: Row, mimeType: string): EntityMaterialVO {
    return {
      ...pick(row, ['name', 'icon', 'sourceUrl', 'createdAt', 'updatedAt']),
      mimeType,
      id: row.id,
      parentId: row.parentId,
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
      if (!SqliteMaterialRepository.isFileRow(row)) {
        directories.push(SqliteMaterialRepository.rowToDirectory(row));
      } else {
        materials.push(SqliteMaterialRepository.rowToMaterial(row, row.mimeType));
      }
    }

    const childrenCounts = await this.getChildrenCounts(directories.map(({ id }) => id));

    for (const directory of directories) {
      directory.childrenCount = childrenCounts[directory.id] || 0;
    }

    return [...directories, ...materials];
  }

  async findOneById(id: MaterialVO['id']) {
    const row = await this.knex<Row>(this.schema.tableName)
      .leftJoin(this.files.tableName, `${this.schema.tableName}.fileId`, `${this.files.tableName}.id`)
      .select(`${this.files.tableName}.mimeType`, this.knex.raw(`${this.schema.tableName}.*`))
      .where(`${this.schema.tableName}.id`, id)
      .first();

    if (!row) {
      return null;
    }

    if (SqliteMaterialRepository.isFileRow(row)) {
      return SqliteMaterialRepository.rowToMaterial(row, row.mimeType);
    }

    const childrenCounts = await this.getChildrenCounts([id]);
    return SqliteMaterialRepository.rowToDirectory(row, childrenCounts[id]);
  }

  async findBlobById(id: MaterialVO['id']) {
    const row = await this.knex(this.schema.tableName)
      .join(this.files.tableName, `${this.schema.tableName}.fileId`, `${this.files.tableName}.id`)
      .where(`${this.schema.tableName}.id`, id)
      .first();

    if (row) {
      return (row.data as Uint8Array).buffer;
    }

    return null;
  }

  readonly createAnnotation = this.annotations.create.bind(this.annotations);
  readonly findAllAnnotations = this.annotations.findAll.bind(this.annotations);
  readonly removeAnnotation = this.annotations.remove.bind(this.annotations);
  readonly updateAnnotation = this.annotations.update.bind(this.annotations);
  readonly findAnnotationById = this.annotations.findOneById.bind(this.annotations);

  private static isFileRow(row: Row) {
    return Boolean(row.fileId);
  }

  async updateText<T>(materialId: MaterialVO['id'], payload: T) {
    const row = await this.knex<Row>(this.schema.tableName).where('id', materialId).first();

    if (!row?.fileId) {
      return null;
    }

    return (await this.files.updateText(row.fileId, JSON.stringify(payload))) ? payload : null;
  }
}
