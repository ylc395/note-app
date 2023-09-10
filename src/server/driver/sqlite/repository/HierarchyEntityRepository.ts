import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';

import type { EntityId, HierarchyEntity } from 'model/entity';
import { getIds } from 'utils/collection';

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

  async findAncestorIds(id: EntityId) {
    const ancestorIds = await this.db
      .withRecursive('ancestors', (qb) =>
        qb
          .selectFrom(this.tableName)
          .select(['id', 'parentId'])
          .where('id', '=', id)
          .union(
            qb
              .selectFrom('ancestors')
              .select([`${this.tableName}.id`, `${this.tableName}.parentId`])
              .innerJoin(this.tableName, `${this.tableName}.id`, 'ancestors.parentId'),
          ),
      )
      .selectFrom('ancestors')
      .select('ancestors.id')
      .where('ancestors.id', '!=', id)
      .execute();

    return getIds(ancestorIds);
  }

  async findDescendantIds(ids: EntityId[]) {
    if (ids.length === 0) {
      return {};
    }

    const rows = await this.db
      .withRecursive(
        'descendants',
        (qb) =>
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
        // todo: add a limit statement to stop infinite recursive
      )
      .selectFrom('descendants')
      .select(['descendants.id', 'descendants.parentId'])
      .where('descendants.id', 'not in', ids)
      .execute();

    return HierarchyEntityRepository.groupDescantsByAncestorId(ids, rows);
  }

  private static groupDescantsByAncestorId<T extends HierarchyEntity>(ancestorIds: EntityId[], entities: T[]) {
    const groups = groupBy(entities, 'parentId');
    const result: Record<EntityId, EntityId[]> = {};

    for (const id of ancestorIds) {
      const entity = entities.find((entity) => id === entity.id);
      const descendants: T[] = entity ? [entity] : [];

      const findChildren = (parentId: EntityId) => {
        const children = groups[parentId];

        if (children) {
          descendants.push(...children);

          for (const child of children) {
            findChildren(child.id);
          }
        }
      };

      findChildren(id);

      result[id] = getIds(descendants);
    }

    return result;
  }
}
