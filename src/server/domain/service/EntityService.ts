import { Injectable, Inject, forwardRef } from '@nestjs/common';
import groupBy from 'lodash/groupBy';
import { type EntityLocator, type EntityId, EntityTypes } from 'interface/entity';

import BaseService from './BaseService';
import NoteService from './NoteService';
import MaterialService from './MaterialService';
import { buildIndex } from 'utils/collection';

interface HierarchyEntity {
  id: EntityId;
  parentId: EntityId | null;
}

@Injectable()
export default class EntityService extends BaseService {
  @Inject(forwardRef(() => NoteService)) private readonly noteService!: NoteService;
  @Inject(forwardRef(() => MaterialService)) private readonly materialService!: MaterialService;

  async assertAvailableEntities(entities: EntityLocator[]) {
    const groups = groupBy(entities, 'type');

    const isValid = await Promise.all(
      Object.entries(groups).map(([type, entitiesOfType]) => {
        const ids = entitiesOfType.map(({ id }) => id);

        switch (Number(type)) {
          case EntityTypes.Note:
            return this.noteService.areAvailable(ids);
          default:
            return true;
        }
      }),
    );

    if (!isValid.every((result) => result)) {
      throw new Error('invalid entities');
    }
  }

  static groupDescants<T extends HierarchyEntity>(ids: EntityId[], entities: T[]) {
    const groups = groupBy(entities, 'parentId');
    const result: Record<EntityId, T[]> = {};

    for (const id of ids) {
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

      result[id] = descendants;
    }

    return result;
  }

  static getAncestorsMap<T extends HierarchyEntity>(ids: EntityId[], entities: T[]) {
    const entitiesMap = buildIndex(entities, 'id');
    const ancestorsMap: Record<EntityId, T[]> = {};

    for (const id of ids) {
      const ancestors: T[] = [];
      let entity = entitiesMap[id];

      while (entity) {
        ancestors.push(entity);
        entity = entity.parentId ? entitiesMap[entity.parentId] : undefined;
      }

      ancestorsMap[id] = ancestors;
    }

    return ancestorsMap;
  }
}
