import type { ParsedDiff } from 'diff';

import type { RevisionRepository, Query, EntitiesParams } from '#domain/server/repository/revisionRepository.js';
import type { Revision, RevisionPatchDTO } from '#domain/shared/model/revision.js';
import BaseRepository from './BaseRepository.js';

import schema, { type Row } from '../schema/revision.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as entityTableName } from '../schema/entity.js';

export default class SqliteRevisionRepository extends BaseRepository implements RevisionRepository {
  private readonly tableName = schema.tableName;

  public async findAll(q: Query) {
    let sql = this.db
      .selectFrom(this.tableName)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.entityId`,
        `${this.tableName}.titleDiff`,
        `${this.tableName}.bodyDiff`,
        `${this.tableName}.previousId`,
        `${this.tableName}.appName`,
        `${this.tableName}.deviceName`,
        `${this.tableName}.name`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.isAuto`,
      ]);

    if (q.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.entityId`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    if (q.entityIds) {
      sql = sql.where(`${this.tableName}.entityId`, 'in', q.entityIds);
    }

    if (q.ids) {
      sql = sql.where(`${this.tableName}.id`, 'in', q.ids);
    }

    const rows = await sql.execute();

    return rows.map(SqliteRevisionRepository.rowToRevision);
  }

  public async updateOne(id: Revision['id'], patch: RevisionPatchDTO) {
    const { numUpdatedRows } = await this.db
      .updateTable(this.tableName)
      .where('id', '=', id)
      .set(patch)
      .executeTakeFirst();

    return Number(numUpdatedRows) === 1;
  }

  public async batchCreate(revisions: Revision[]) {
    const rows: Row[] = revisions.map((revision) => ({
      ...revision,
      titleDiff: revision.titleDiff ? JSON.stringify(revision.titleDiff) : null,
      bodyDiff: revision.bodyDiff ? JSON.stringify(revision.bodyDiff) : null,
      isAuto: revision.isAuto ? 1 : 0,
    }));

    await this.db.insertInto(this.tableName).values(rows).execute();
  }

  public async findEntitiesWithoutRevision({ updatedAfter, isAvailableOnly }: EntitiesParams) {
    let sql = this.db
      .selectFrom(entityTableName)
      .select([
        `${entityTableName}.id`,
        `${entityTableName}.title`,
        `${entityTableName}.icon`,
        `${entityTableName}.type`,
        `${entityTableName}.parentId`,
        `${entityTableName}.createdAt`,
        `${entityTableName}.updatedAt`,
      ])
      .leftJoin(this.tableName, `${entityTableName}.id`, `${this.tableName}.entityId`)
      .where(`${entityTableName}.updatedAt`, '>=', updatedAfter)
      .groupBy(`${entityTableName}.id`)
      .having(
        (eb) => eb.fn.count(eb.case().when(`${this.tableName}.createdAt`, '>', updatedAfter).then(1).end()),
        '=',
        0,
      );

    if (isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${this.tableName}.entityId`, `${recyclableTableName}.entityId`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const rows = await sql.execute();
    return rows;
  }

  private static rowToRevision(row: Row) {
    return {
      ...row,
      isAuto: Boolean(row.isAuto),
      titleDiff: typeof row.titleDiff === 'string' ? (JSON.parse(row.titleDiff) as ParsedDiff) : null,
      bodyDiff: typeof row.bodyDiff === 'string' ? (JSON.parse(row.bodyDiff) as ParsedDiff) : null,
    };
  }
}
