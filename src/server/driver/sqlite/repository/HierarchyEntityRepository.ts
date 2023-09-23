import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';

import type { EntityId, HierarchyEntity } from 'model/entity';
import { buildIndex, getIds } from 'utils/collection';

import BaseRepository from './BaseRepository';
import { tableName as recyclableTableName } from '../schema/recyclable';
import type { tableName as noteTableName } from '../schema/note';
import type { tableName as materialTableName } from '../schema/material';
import type { tableName as memoTableName } from '../schema/memo';

export default abstract class HierarchyEntityRepository extends BaseRepository {
  abstract readonly tableName: typeof noteTableName | typeof materialTableName | typeof memoTableName;

  async findChildrenIds(ids: EntityId[], { isAvailable }: { isAvailable?: boolean } = {}) {
    let qb = this.db.selectFrom(this.tableName).selectAll(this.tableName);

    if (typeof isAvailable === 'boolean') {
      qb = qb
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, isAvailable ? 'is' : 'is not', null);
    }

    qb = qb.where('parentId', 'in', ids);

    const rows = await qb.execute();

    return mapValues(groupBy(rows, 'parentId'), getIds);
  }

  async findAncestorIds(ids: EntityId[]) {
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

    return HierarchyEntityRepository.groupAncestorIdsByDescantId(
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
          .where((eb) => eb.or([eb.cmpr('id', 'in', ids), eb.cmpr('parentId', 'in', ids)]))
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

    return HierarchyEntityRepository.groupDescantsByAncestorId(ids, rows);
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
          descendantIds.push(...getIds(children));

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
}
