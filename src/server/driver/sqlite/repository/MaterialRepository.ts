import pick from 'lodash/pick';
import omit from 'lodash/omit';
import type { Selectable } from 'kysely';

import {
  MaterialTypes,
  type MaterialDTO,
  type Directory,
  type EntityMaterial,
  type Material,
  type MaterialQuery,
} from 'model/material';
import type { MaterialRepository } from 'service/repository/MaterialRepository';

import schema, { type Row } from '../schema/material';
import fileSchema, { type Row as FileRow } from '../schema/file';
import FileRepository from './FileRepository';
import MaterialAnnotationRepository from './MaterialAnnotationRepository';
import HierarchyEntityRepository from './HierarchyEntityRepository';

export default class SqliteMaterialRepository extends HierarchyEntityRepository implements MaterialRepository {
  readonly tableName = schema.tableName;
  private readonly files = new FileRepository(this.db);
  private readonly annotations = new MaterialAnnotationRepository(this.db);
  async createDirectory(directory: MaterialDTO) {
    const createdRow = await this.createOne(this.tableName, { ...directory, id: this.generateId() });
    return SqliteMaterialRepository.rowToDirectory(createdRow);
  }

  async createEntity(material: MaterialDTO) {
    if (!material.fileId) {
      throw new Error('no fileId');
    }

    const file: FileRow | null = await this.files.findOneById(material.fileId);

    if (!file) {
      throw new Error('no file');
    }

    const createdMaterial = await this.createOne(this.tableName, {
      ...pick(material, ['name', 'icon', 'parentId']),
      id: this.generateId(),
      fileId: material.fileId,
    });

    return SqliteMaterialRepository.rowToMaterial(createdMaterial, file.mimeType);
  }

  private static rowToDirectory(
    row: Selectable<Row> & { fileId?: FileRow['id'] | null; mimeType?: FileRow['mimeType'] | null },
  ) {
    return omit(row, ['fileId', 'sourceUrl', 'mimeType']);
  }

  private static rowToMaterial(row: Selectable<Row>, mimeType: string) {
    return {
      ...pick(row, ['name', 'icon', 'sourceUrl', 'createdAt', 'updatedAt']),
      mimeType,
      id: row.id,
      parentId: row.parentId,
    };
  }

  async findAll(query: MaterialQuery) {
    let qb = this.db.selectFrom(this.tableName);

    if (query.id) {
      qb = qb.where(`${this.tableName}.id`, 'in', query.id);
    }

    if (query.type) {
      qb = qb.where(`${this.tableName}.fileId`, query.type === MaterialTypes.Directory ? 'is' : 'is not', null);
    }

    if (typeof query.parentId !== 'undefined') {
      qb = qb.where(`${this.tableName}.parentId`, query.parentId === null ? 'is' : '=', query.parentId);
    }

    const rows = await qb
      .leftJoin(fileSchema.tableName, `${this.tableName}.fileId`, `${fileSchema.tableName}.id`)
      .selectAll(this.tableName)
      .select([`${fileSchema.tableName}.mimeType`])
      .execute();

    const directories: Directory[] = [];
    const materials: EntityMaterial[] = [];

    for (const row of rows) {
      if (!SqliteMaterialRepository.isFileRow(row)) {
        directories.push(SqliteMaterialRepository.rowToDirectory(row));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        materials.push(SqliteMaterialRepository.rowToMaterial(row, row.mimeType!));
      }
    }

    return [...directories, ...materials];
  }

  async findOneById(id: Material['id']) {
    const row = await this.db
      .selectFrom(this.tableName)
      .leftJoin(fileSchema.tableName, `${this.tableName}.fileId`, `${fileSchema.tableName}.id`)
      .selectAll(this.tableName)
      .select(`${fileSchema.tableName}.mimeType`)
      .where(`${this.tableName}.id`, '=', id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    if (SqliteMaterialRepository.isFileRow(row)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return SqliteMaterialRepository.rowToMaterial(row, row.mimeType!);
    }

    return SqliteMaterialRepository.rowToDirectory(row);
  }

  async findBlobById(id: Material['id']) {
    const row = await this.db
      .selectFrom(this.tableName)
      .innerJoin(fileSchema.tableName, `${this.tableName}.fileId`, `${fileSchema.tableName}.id`)
      .selectAll()
      .where(`${this.tableName}.id`, '=', id)
      .executeTakeFirst();

    if (row) {
      return FileRepository.getBlob(row);
    }

    return null;
  }

  readonly createAnnotation = this.annotations.create.bind(this.annotations);
  readonly findAllAnnotations = this.annotations.findAll.bind(this.annotations);
  readonly removeAnnotation = this.annotations.remove.bind(this.annotations);
  readonly updateAnnotation = this.annotations.update.bind(this.annotations);
  readonly findAnnotationById = this.annotations.findOneById.bind(this.annotations);

  private static isFileRow(row: Selectable<Row>) {
    return Boolean(row.fileId);
  }
}
