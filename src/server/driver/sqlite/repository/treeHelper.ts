import type { EntityId, HierarchyEntity } from 'model/entity';
import groupBy from 'lodash/groupBy';
import { getIds } from 'utils/collection';

export function groupDescantsByAncestorId<T extends HierarchyEntity>(ancestorIds: EntityId[], entities: T[]) {
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
