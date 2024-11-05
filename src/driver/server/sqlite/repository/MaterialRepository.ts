import assert from 'assert';
import { pick } from 'lodash-es';
import type { Material, MaterialQuery, MaterialPatch } from '@domain/server/model/material.js';
import type { MaterialRepository } from '@domain/server/repository/MaterialRepository.js';
import { buildIndex } from '@utils/collection.js';

import schema from '../schema/material.js';
import { tableName as fileTableName } from '../schema/file.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import BaseRepository from './BaseRepository.js';
import FileRepository from './FileRepository.js';

export default class SqliteMaterialRepository extends BaseRepository implements MaterialRepository {
  public readonly tableName = schema.tableName;

  public async findFiles(ids: Material['id'][]) {
    const rows = await this.db
      .selectFrom(fileTableName)
      .innerJoin(this.tableName, `${fileTableName}.id`, `${this.tableName}.fileId`)
      .where(`${fileTableName}.id`, 'in', ids)
      .select([`${fileTableName}.id`, 'mimeType', 'lang', 'size', `${this.tableName}.id as materialId`])
      .execute();

    const fileVOs = rows.map(FileRepository.rowToFileVO);

    return buildIndex(fileVOs, 'materialId');
  }

  public async create(material: Material) {
    await this.db.insertInto(this.tableName).values(material).executeTakeFirst();
    const inserted = await this.findOneById(material.id);

    assert(inserted);
    return inserted;
  }

  public async findAll(q: MaterialQuery) {
    let qb = this.db
      .selectFrom(this.tableName)
      .leftJoin(fileTableName, `${this.tableName}.fileId`, `${fileTableName}.id`);

    if (q.isAvailableOnly) {
      qb = qb
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    if (q.fileHash) {
      qb = qb.where(`${fileTableName}.hash`, '=', q.fileHash);
    }

    if (q.id) {
      qb = qb.where(`${this.tableName}.id`, 'in', q.id);
    }

    if (Array.isArray(q.parentId)) {
      qb = qb.where('parentId', 'in', q.parentId);
    } else if (typeof q.parentId !== 'undefined') {
      qb = qb.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    const rows = await qb
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.title`,
        `${this.tableName}.icon`,
        `${this.tableName}.parentId`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
        `${this.tableName}.fileId`,
        `${this.tableName}.body`,
        `${this.tableName}.sourceUrl`,
        `${fileTableName}.mimeType`,
        `${fileTableName}.size`,
        `${fileTableName}.lang`,
      ])
      .execute();

    return rows.map((row) => {
      const material = pick(row, ['id', 'title', 'icon', 'parentId', 'createdAt', 'updatedAt']);

      if (row.fileId) {
        assert(row.mimeType && row.lang && typeof row.size === 'number');

        return {
          ...material,
          ...pick(row, ['sourceUrl', 'body']),
          file: {
            id: row.fileId,
            lang: JSON.parse(row.lang),
            mimeType: row.mimeType,
            size: row.size,
          },
        };
      }

      return material;
    });
  }

  public async findOneById(id: Material['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .leftJoin(fileTableName, `${this.tableName}.fileId`, `${fileTableName}.id`)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.title`,
        `${this.tableName}.icon`,
        `${this.tableName}.parentId`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
        `${this.tableName}.fileId`,
        `${this.tableName}.body`,
        `${this.tableName}.sourceUrl`,
        `${fileTableName}.mimeType`,
      ])
      .where(`${this.tableName}.id`, '=', id);

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql.executeTakeFirst();

    return row || null;
  }

  public async findBlobById(id: Material['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .innerJoin(fileTableName, `${this.tableName}.fileId`, `${fileTableName}.id`)
      .select([`${fileTableName}.data`])
      .where(`${this.tableName}.id`, '=', id);

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql.executeTakeFirst();

    if (row) {
      return FileRepository.getBlob(row);
    }

    return null;
  }

  public async update(id: Material['id'] | Material['id'][], patch: MaterialPatch) {
    const { numUpdatedRows } = await this.db
      .updateTable(this.tableName)
      .set(patch)
      .where('id', Array.isArray(id) ? 'in' : '=', id)
      .executeTakeFirst();

    return Array.isArray(id) ? id.length === Number(numUpdatedRows) : Number(numUpdatedRows) === 1;
  }
}
