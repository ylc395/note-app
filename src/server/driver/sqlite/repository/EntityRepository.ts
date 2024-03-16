import { mapValues, groupBy } from 'lodash-es';
import type { Entity, EntityId } from '@domain/model/entity.js';
import type { EntityRepository } from '@domain/service/repository/EntityRepository.js';

import { tableName } from '../schema/entity.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import BaseRepository from './BaseRepository.js';
import { buildIndex } from '@utils/collection.js';

export default class SqliteEntityRepository extends BaseRepository implements EntityRepository {
  private readonly tableName = tableName;

  private static readonly selectedFields = [
    'id',
    'parentId',
    'title',
    'updatedAt',
    'createdAt',
    'icon',
    'type',
  ] as const;

  public async findOneById(id: EntityId) {
    const row = await this.db
      .selectFrom(this.tableName)
      .select([...SqliteEntityRepository.selectedFields, 'content'])
      .where('id', '=', id)
      .executeTakeFirst();

    return row || null;
  }

  public async findChildrenIds(ids: EntityId[], options?: { isAvailableOnly?: boolean }) {
    let qb = this.db.selectFrom(this.tableName).selectAll(this.tableName);

    if (options?.isAvailableOnly) {
      qb = qb
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    qb = qb.where('parentId', 'in', ids);

    const rows = await qb.execute();
    return mapValues(groupBy(rows, 'parentId'), (rows) => rows.map((row) => row.id));
  }

  public async findAncestors(ids: EntityId[]) {
    const rows = await this.db
      .withRecursive('ancestors', (qb) =>
        qb
          .selectFrom(this.tableName)
          .select(SqliteEntityRepository.selectedFields)
          .where('id', 'in', ids)
          .union(
            qb
              .selectFrom('ancestors')
              .select(SqliteEntityRepository.selectedFields.map((field) => `${this.tableName}.${field}` as const))
              .innerJoin(this.tableName, `${this.tableName}.id`, 'ancestors.parentId'),
          ),
      )
      .selectFrom('ancestors')
      .select(SqliteEntityRepository.selectedFields)
      .execute();

    const descendants = rows.filter(({ id }) => ids.includes(id));
    const entitiesMap = buildIndex(rows);
    const result: Record<EntityId, Entity[]> = {};

    for (const descendant of descendants) {
      const ancestors: Entity[] = [];
      let parentId = descendant.parentId;

      while (parentId) {
        ancestors.unshift(descendant);
        const parent = entitiesMap[parentId];

        if (!parent) {
          break;
        }

        parentId = parent.parentId;
      }

      result[descendant.id] = ancestors;
    }

    return result;
  }

  async findDescendantIds(ids: EntityId[]) {
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

    return result;
  }

  public async findAllAvailable(ids: EntityId[]) {
    const rows = await this.db
      .selectFrom(this.tableName)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
      .where(`${recyclableTableName}.entityId`, 'is', null)
      .where(`${this.tableName}.id`, 'in', ids)
      .select(SqliteEntityRepository.selectedFields.map((field) => `${this.tableName}.${field}` as const))
      .execute();

    return rows;
  }

  public async *findAllContents(entities: EntityId[]) {
    const stream = this.db.selectFrom(this.tableName).select(['id', 'content']).where('id', 'in', entities).stream();

    for await (const row of stream) {
      yield row;
    }
  }
}
