import { omit } from 'lodash-es';
import type { Selectable } from 'kysely';

import type { Material, MaterialQuery, MaterialPatch, NewMaterialDTO } from '@domain/model/material.js';
import type { MaterialRepository } from '@domain/service/repository/MaterialRepository.js';

import schema, { type Row } from '../schema/material.js';
import { type Row as FileRow, tableName as fileTableName } from '../schema/file.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import FileRepository from './FileRepository.js';
import HierarchyEntityRepository from './HierarchyEntityRepository.js';

export default class SqliteMaterialRepository extends HierarchyEntityRepository implements MaterialRepository {
  public readonly tableName = schema.tableName;
  private readonly files = new FileRepository(this.sqliteDb);

  public async create(material: NewMaterialDTO) {
    let file: Selectable<FileRow> | null = null;

    if (material.fileId) {
      file = await this.files.findOneById(material.fileId);
    }

    const createdMaterial = await this.createOneOn(this.tableName, {
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

  public async findAll(q: MaterialQuery) {
    let qb = this.db
      .selectFrom(this.tableName)
      .leftJoin(fileTableName, `${this.tableName}.fileId`, `${fileTableName}.id`);

    if (typeof q?.isAvailable === 'boolean') {
      qb = qb
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, q.isAvailable ? 'is' : 'is not', null);
    }

    if (q.fileHash) {
      qb = qb.where(`${fileTableName}.hash`, '=', q.fileHash);
    }

    if (q.id) {
      qb = qb.where(`${this.tableName}.id`, 'in', q.id);
    }

    if (typeof q.parentId !== 'undefined') {
      qb = qb.where(`${this.tableName}.parentId`, q.parentId === null ? 'is' : '=', q.parentId);
    }

    const rows = await qb
      .selectAll(this.tableName)
      .select([`${fileTableName}.mimeType`])
      .execute();

    return rows.map((row) => SqliteMaterialRepository.rowToMaterial(row, row.mimeType));
  }

  public async findOneById(id: Material['id'], availableOnly?: boolean) {
    let sql = this.db
      .selectFrom(this.tableName)
      .leftJoin(fileTableName, `${this.tableName}.fileId`, `${fileTableName}.id`)
      .selectAll(this.tableName)
      .select(`${fileTableName}.mimeType`)
      .where(`${this.tableName}.id`, '=', id);

    if (availableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql.executeTakeFirst();

    if (!row) {
      return null;
    }

    return SqliteMaterialRepository.rowToMaterial(row, row.mimeType);
  }

  public async findBlobById(id: Material['id']) {
    const row = await this.db
      .selectFrom(this.tableName)
      .innerJoin(fileTableName, `${this.tableName}.fileId`, `${fileTableName}.id`)
      .select([`${fileTableName}.data`])
      .where(`${this.tableName}.id`, '=', id)
      .executeTakeFirst();

    if (row) {
      return FileRepository.getBlob(row);
    }

    return null;
  }

  public async update(id: Material['id'] | Material['id'][], patch: MaterialPatch) {
    const { numUpdatedRows } = await this.db
      .updateTable(this.tableName)
      .set({ ...patch, updatedAt: Date.now() })
      .where('id', Array.isArray(id) ? 'in' : '=', id)
      .executeTakeFirst();

    return Array.isArray(id) ? id.length === Number(numUpdatedRows) : Number(numUpdatedRows) === 1;
  }
}
