import { mapValues, groupBy } from 'lodash-es';
import { Entity, EntityId, EntityTypes } from '#domain/shared/model/entity.js';
import type { EntityRepository, EntityQuery } from '#domain/server/repository/entityRepository.js';
import assert from 'node:assert';

import { arrayOf, buildIndex } from '#utils/collection.js';
import { tableName } from '../schema/entity.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import BaseRepository from './BaseRepository.js';

export default class SqliteEntityRepository extends BaseRepository implements EntityRepository {
  protected readonly tableName = tableName;

  public async findChildrenIds(ids: EntityId[], options?: { isAvailableOnly?: boolean }) {
    let qb = this.db.selectFrom(this.tableName).selectAll(this.tableName);

    if (options?.isAvailableOnly) {
      qb = qb
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    qb = qb.where('parentId', 'in', ids).where('type', '!=', EntityTypes.Annotation);

    const rows = await qb.execute();
    return mapValues(groupBy(rows, 'parentId'), (rows) => rows.map((row) => row.id));
  }

  public async findAncestors(ids: EntityId[]): Promise<Record<string, Entity[]>>;
  public async findAncestors(id: EntityId): Promise<Entity[]>;
  public async findAncestors(ids: EntityId[] | EntityId) {
    const fields = ['id', 'title', 'icon', 'type', 'parentId', 'createdAt', 'updatedAt'] as const;

    const rows = await this.db
      .withRecursive('ancestors', (qb) =>
        qb
          .selectFrom(this.tableName)
          .select(fields)
          .where('id', 'in', Array.isArray(ids) ? ids : [ids])
          .union(
            qb
              .selectFrom('ancestors')
              .select(fields)
              .innerJoin(this.tableName, `${this.tableName}.id`, 'ancestors.parentId'),
          ),
      )
      .selectFrom('ancestors')
      .selectAll()
      .execute();

    const descendants = rows.filter(({ id }) => ids.includes(id));
    const entitiesMap = buildIndex(rows);
    const result: Record<EntityId, Entity[]> = {};

    for (const descendant of descendants) {
      const ancestors: Entity[] = [];
      let parentId = descendant.parentId;

      while (parentId) {
        const parent = entitiesMap[parentId];
        assert(parent);

        ancestors.unshift(parent);
        parentId = parent.parentId;
      }

      result[descendant.id] = ancestors;
    }

    if (Array.isArray(ids)) {
      return result;
    } else {
      return result[ids];
    }
  }

  public async findDescendantIds(id: EntityId): Promise<EntityId[]>;
  public async findDescendantIds(ids: EntityId[]): Promise<Record<EntityId, EntityId[]>>;
  public async findDescendantIds(ids: EntityId | EntityId[]) {
    ids = arrayOf(ids);

    if (ids.length === 0) {
      return {};
    }

    const rows = await this.db
      .withRecursive('descendants', (qb) =>
        qb
          .selectFrom(this.tableName)
          .select(['id', 'parentId'])
          .where((eb) => eb.or([eb('id', 'in', ids), eb('parentId', 'in', ids)]))
          .union(
            qb
              .selectFrom('descendants')
              .select([`${this.tableName}.id`, `${this.tableName}.parentId`])
              .innerJoin(this.tableName, `${this.tableName}.parentId`, 'descendants.id'),
          ),
      )
      .selectFrom('descendants')
      .select(['descendants.id', 'descendants.parentId'])
      .execute();

    const groups = groupBy(rows, 'parentId');
    const result: Record<EntityId, EntityId[]> = {};

    for (const id of ids) {
      const descendantIds: EntityId[] = [];

      const findChildren = (parentId: EntityId) => {
        const children = groups[parentId];

        if (children) {
          descendantIds.push(...children.map((child) => child.id));

          for (const child of children) {
            findChildren(child.id);
          }
        }
      };

      findChildren(id);

      result[id] = descendantIds;
    }

    if (Array.isArray(ids)) {
      return result;
    }

    return result[ids];
  }

  public async findAll(params: EntityQuery) {
    const fields = [
      `${tableName}.id`,
      `${tableName}.title`,
      `${tableName}.type`,
      `${tableName}.icon`,
      `${tableName}.parentId`,
      `${tableName}.createdAt`,
      `${tableName}.updatedAt`,
    ] as const;

    let sql = this.db.selectFrom(this.tableName);

    if (params.ids) {
      sql = sql.where(`${this.tableName}.id`, 'in', params.ids);
    }

    if (params.updatedSince) {
      sql = sql.where(`${this.tableName}.updatedAt`, '>', params.updatedSince);
    }

    if (params.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const rows = await sql.select(fields).execute();

    return rows;
  }

  public async findOneById(id: EntityId) {
    const fields = ['title', 'body'] as const;
    return (await this.db.selectFrom(this.tableName).select(fields).where('id', '=', id).executeTakeFirst()) || null;
  }

  public async findAllContents(entities: EntityId[]) {
    return this.db.selectFrom(this.tableName).select(['id', 'body']).where('id', 'in', entities).stream();
  }
}
