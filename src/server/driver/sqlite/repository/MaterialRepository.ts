import omit from 'lodash/omit';
import type { Selectable } from 'kysely';

import {
  MaterialTypes,
  type MaterialDirectory,
  type MaterialEntity,
  type Material,
  type MaterialQuery,
  type MaterialPatch,
  type NewMaterialDirectory,
  type NewMaterialEntity,
} from 'model/material';
import type { MaterialRepository } from 'service/repository/MaterialRepository';

import schema, { type Row } from '../schema/material';
import fileSchema, { type Row as FileRow } from '../schema/file';
import { tableName as recyclableTableName } from '../schema/recyclable';
import FileRepository from './FileRepository';
import MaterialAnnotationRepository from './MaterialAnnotationRepository';
import HierarchyEntityRepository from './HierarchyEntityRepository';

export default class SqliteMaterialRepository extends HierarchyEntityRepository implements MaterialRepository {
  readonly tableName = schema.tableName;
  private readonly files = new FileRepository(this.sqliteDb);
  private readonly annotations = new MaterialAnnotationRepository(this.sqliteDb);
  async createDirectory(directory: NewMaterialDirectory) {
    const createdRow = await this.createOne(this.tableName, { ...directory, id: this.generateId() });
    return SqliteMaterialRepository.rowToDirectory(createdRow);
  }

  async createEntity(material: NewMaterialEntity) {
    if (!material.fileId) {
      throw new Error('no fileId');
    }

    const file = await this.files.findOneById(material.fileId);

    if (!file) {
      throw new Error('no file');
    }

    const createdMaterial = await this.createOne(this.tableName, {
      ...material,
      id: material.id || this.generateId(),
    });

    return SqliteMaterialRepository.rowToMaterial(createdMaterial, file.mimeType);
  }

  private static rowToDirectory(
    row: Selectable<Row> & { fileId?: FileRow['id'] | null; mimeType?: FileRow['mimeType'] | null },
  ) {
    return omit(row, ['fileId', 'sourceUrl', 'mimeType', 'comment']);
  }

  private static rowToMaterial(row: Selectable<Row>, mimeType: string) {
    return { ...omit(row, ['fileId']), mimeType };
  }

  async findAll(q: MaterialQuery) {
    let qb = this.db.selectFrom(this.tableName);

    if (typeof q?.isAvailable === 'boolean') {
      qb = qb
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, q.isAvailable ? 'is' : 'is not', null);
    }

    if (q.id) {
      qb = qb.where(`${this.tableName}.id`, 'in', q.id);
    }

    if (q.type) {
      qb = qb.where(`${this.tableName}.fileId`, q.type === MaterialTypes.Directory ? 'is' : 'is not', null);
    }

    if (typeof q.parentId !== 'undefined') {
      qb = qb.where(`${this.tableName}.parentId`, q.parentId === null ? 'is' : '=', q.parentId);
    }

    const rows = await qb
      .leftJoin(fileSchema.tableName, `${this.tableName}.fileId`, `${fileSchema.tableName}.id`)
      .selectAll(this.tableName)
      .select([`${fileSchema.tableName}.mimeType`])
      .execute();

    const directories: MaterialDirectory[] = [];
    const materials: MaterialEntity[] = [];

    for (const row of rows) {
      if (!SqliteMaterialRepository.isFileRow(row)) {
        directories.push(SqliteMaterialRepository.rowToDirectory(row));
      } else {
        materials.push(SqliteMaterialRepository.rowToMaterial(row, row.mimeType));
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
      .where(`${fileSchema.tableName}.mimeType`, 'is not', null)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return SqliteMaterialRepository.isFileRow(row) ? SqliteMaterialRepository.rowToMaterial(row, row.mimeType) : null;
  }

  async findBlobById(id: Material['id']) {
    const row = await this.db
      .selectFrom(this.tableName)
      .innerJoin(fileSchema.tableName, `${this.tableName}.fileId`, `${fileSchema.tableName}.id`)
      .select([`${fileSchema.tableName}.data`])
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

  private static isFileRow(row: Selectable<Row>): row is Selectable<Row> & { mimeType: string } {
    return Boolean(row.fileId);
  }

  update(id: Material['id'], material: MaterialPatch): Promise<Material | null>;
  update(id: Material['id'][], material: MaterialPatch): Promise<Material[]>;
  async update(id: Material['id'] | Material['id'][], patch: MaterialPatch) {
    await this.db
      .updateTable(this.tableName)
      .set({ ...patch, updatedAt: Date.now() })
      .where('id', Array.isArray(id) ? 'in' : '=', id)
      .execute();

    const rows = await this.findAll({ id: Array.isArray(id) ? id : [id] });

    if (Array.isArray(id)) {
      return rows;
    }

    return rows[0] || null;
  }
}
