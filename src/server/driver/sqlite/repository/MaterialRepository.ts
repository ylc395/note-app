import { omit } from 'lodash-es';
import type { Selectable } from 'kysely';

import type { Material, MaterialQuery, MaterialPatch, NewMaterialDTO } from '@domain/model/material.js';
import type { MaterialRepository } from '@domain/service/repository/MaterialRepository.js';

import schema, { type Row } from '../schema/material.js';
import fileSchema, { type Row as FileRow } from '../schema/file.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import FileRepository from './FileRepository.js';
import HierarchyEntityRepository from './HierarchyEntityRepository.js';

export default class SqliteMaterialRepository extends HierarchyEntityRepository implements MaterialRepository {
  readonly tableName = schema.tableName;
  private readonly files = new FileRepository(this.sqliteDb);

  async create(material: NewMaterialDTO) {
    let file: Selectable<FileRow> | null = null;

    if (material.fileId) {
      file = await this.files.findOneById(material.fileId);
    }

    const createdMaterial = await this.createOne(this.tableName, {
      ...material,
      id: this.generateId(),
    });

    return SqliteMaterialRepository.rowToMaterial(createdMaterial, file?.mimeType);
  }

  private static rowToMaterial(row: Selectable<Row>, mimeType?: string | null) {
    return {
      ...omit(row, ['fileId']),
      ...(mimeType ? { mimeType } : null),
    };
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

    if (typeof q.parentId !== 'undefined') {
      qb = qb.where(`${this.tableName}.parentId`, q.parentId === null ? 'is' : '=', q.parentId);
    }

    const rows = await qb
      .leftJoin(fileSchema.tableName, `${this.tableName}.fileId`, `${fileSchema.tableName}.id`)
      .selectAll(this.tableName)
      .select([`${fileSchema.tableName}.mimeType`])
      .execute();

    return rows.map((row) => SqliteMaterialRepository.rowToMaterial(row, row.mimeType));
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

    return SqliteMaterialRepository.rowToMaterial(row, row.mimeType);
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

  async update(id: Material['id'] | Material['id'][], patch: MaterialPatch) {
    const { numUpdatedRows } = await this.db
      .updateTable(this.tableName)
      .set({ ...patch, updatedAt: Date.now() })
      .where('id', Array.isArray(id) ? 'in' : '=', id)
      .executeTakeFirst();

    return Array.isArray(id) ? id.length === Number(numUpdatedRows) : Number(numUpdatedRows) === 1;
  }
}
