import { Injectable, Inject, forwardRef } from '@nestjs/common';
import groupBy from 'lodash/groupBy';
import { type EntityLocator, EntityTypes, EntityId } from 'interface/entity';

import BaseService from './BaseService';
import NoteService from './NoteService';
import MaterialService from './MaterialService';
import { buildIndex } from 'utils/collection';

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

  static getAncestorsMap<T extends { parentId: EntityId | null; id: EntityId }>(ids: EntityId[], entities: T[]) {
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
