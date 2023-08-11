import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';

import type { EntityId, HierarchyEntity } from 'model/entity';
import { getIds } from 'utils/collection';

import BaseRepository from './BaseRepository';
import type { Db } from '../Database';

export default abstract class HierarchyEntityRepository extends BaseRepository {
  abstract readonly tableName: keyof Db;
  async findAllChildrenIds(ids: EntityId[]) {
    const rows = await this.db.selectFrom(this.tableName).selectAll().where('parentId', 'in', ids).execute();

    return mapValues(groupBy(rows, 'parentId'), getIds);
  }

  async findAllDescendantIds(materialIds: EntityId[]) {
    if (materialIds.length === 0) {
      return {};
    }

    const rows = await this.db
      .withRecursive(
        'descendants',
        (qb) =>
          qb
            .selectFrom(this.tableName)
            .select(['id', 'parentId'])
            .where((eb) => eb.or([eb.cmpr('id', 'in', materialIds), eb.cmpr('parentId', 'in', materialIds)]))
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
      .execute();

    return HierarchyEntityRepository.groupDescantsByAncestorId(materialIds, rows);
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
