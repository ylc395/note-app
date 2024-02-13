import { mapValues, groupBy } from 'lodash-es';
import type { EntityId, HierarchyEntity } from '@domain/model/entity.js';
import type { EntityRepository } from '@domain/service/repository/EntityRepository.js';

import { tableName } from '../schema/entity.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import BaseRepository from './BaseRepository.js';
import { buildIndex } from '@utils/collection.js';

export default class SqliteEntityRepository extends BaseRepository implements EntityRepository {
  private readonly tableName = tableName;

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

  public async findAncestorIds(ids: EntityId[]) {
    const rows = await this.db
      .withRecursive('ancestors', (qb) =>
        qb
          .selectFrom(this.tableName)
          .select(['id', 'parentId'])
          .where('id', 'in', ids)
          .union(
            qb
              .selectFrom('ancestors')
              .select([`${this.tableName}.id`, `${this.tableName}.parentId`])
              .innerJoin(this.tableName, `${this.tableName}.id`, 'ancestors.parentId'),
          ),
      )
      .selectFrom('ancestors')
      .select(['ancestors.id', 'ancestors.parentId'])
      .execute();

    return SqliteEntityRepository.groupAncestorIdsByDescantId(
      rows.filter(({ id }) => ids.includes(id)),
      rows,
    );
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

    return SqliteEntityRepository.groupDescantsByAncestorId(ids, rows);
  }

  private static groupAncestorIdsByDescantId<T extends HierarchyEntity>(descendants: T[], entities: T[]) {
    const entitiesMap = buildIndex(entities);
    const result: Record<EntityId, EntityId[]> = {};

    for (const { id, parentId } of descendants) {
      const ancestorIds: EntityId[] = [];
      let ancestorId = parentId;

      while (ancestorId) {
        ancestorIds.unshift(ancestorId);
        const parent = entitiesMap[ancestorId];

        if (!parent) {
          break;
        }

        ancestorId = parent.parentId;
      }

      result[id] = ancestorIds;
    }

    return result;
  }

  private static groupDescantsByAncestorId<T extends HierarchyEntity>(ancestorIds: EntityId[], entities: T[]) {
    const groups = groupBy(entities, 'parentId');
    const result: Record<EntityId, EntityId[]> = {};

    for (const id of ancestorIds) {
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
      .select([`${this.tableName}.id`])
      .execute();

    return rows.map(({ id }) => id);
  }

  public async *findAllBody(entities: EntityId[]) {
    const stream = this.db.selectFrom(this.tableName).select(['id', 'content']).where('id', 'in', entities).stream();

    for await (const row of stream) {
      yield row;
    }
  }
}
