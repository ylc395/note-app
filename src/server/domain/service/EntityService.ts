import { Injectable, Inject, forwardRef } from '@nestjs/common';
import groupBy from 'lodash/groupBy';
import compact from 'lodash/compact';
import mapValues from 'lodash/mapValues';

import { type EntityLocator, type EntityId, type HierarchyEntity, EntityTypes, EntityRecord } from 'model/entity';
import { normalizeTitle as normalizeNoteTitle } from 'model/note';
import { normalizeTitle as normalizeMaterialTitle } from 'model/material';
import { digest } from 'model/memo';
import { buildIndex, getIds } from 'utils/collection';

import BaseService from './BaseService';
import NoteService from './NoteService';
import MaterialService from './MaterialService';
import MemoService from './MemoService';

@Injectable()
export default class EntityService extends BaseService {
  @Inject(forwardRef(() => NoteService)) private readonly noteService!: NoteService;
  @Inject(forwardRef(() => MaterialService)) private readonly materialService!: MaterialService;
  @Inject(forwardRef(() => MaterialService)) private readonly memoService!: MemoService;

  private static mapGroupByType<T>(
    entities: EntityLocator[],
    mapper: (type: EntityTypes, ids: EntityId[]) => Promise<T>,
  ) {
    const groups = groupBy(entities, 'type');

    return Promise.all(
      Object.entries(groups).map(([type, entitiesOfType]) =>
        mapper(Number(type) as EntityTypes, getIds(entitiesOfType)),
      ),
    );
  }

  async assertAvailableEntities(entities: EntityLocator[]) {
    const isValid = await EntityService.mapGroupByType(entities, (type, ids) => {
      switch (type) {
        case EntityTypes.Note:
          return this.noteService.areAvailable(ids);
        case EntityTypes.Material:
          return this.materialService.areAvailable(ids);
        case EntityTypes.Memo:
          return this.memoService.areAvailable(ids);
        default:
          return Promise.resolve(true);
      }
    });

    if (!isValid.every((result) => result)) {
      throw new Error('invalid entities');
    }
  }

  async assertValidParents(type: EntityTypes, changeSet: HierarchyEntity[]) {
    const parentIds = compact(changeSet.map(({ parentId }) => parentId));
    await this.assertAvailableEntities(parentIds.map((id) => ({ id, type })));

    // an ancestor note can not be a child of its descants nodes
    const descants = await this.getDescantsOfType(type, getIds(changeSet));

    for (const { id, parentId: newParentId } of changeSet) {
      if (newParentId && (newParentId === id || descants[id]?.includes(newParentId))) {
        throw new Error('invalid new parent id');
      }
    }
  }

  private getDescantsOfType(type: EntityTypes, ids: EntityId[]) {
    switch (type) {
      case EntityTypes.Note:
        return this.notes.findDescendantIds(ids);
      case EntityTypes.Material:
        return this.materials.findDescendantIds(ids);
      case EntityTypes.Memo:
        return this.memos.findDescendantIds(ids);
      default:
        return Promise.resolve({} as Record<EntityId, EntityId[]>);
    }
  }

  async getDescants(entities: EntityLocator[]) {
    const allDescants = await EntityService.mapGroupByType(entities, async (type, ids) => {
      const descants = Object.values(await this.getDescantsOfType(type, ids));
      return descants.flat().map((id) => ({ type, id }));
    });

    return allDescants.flat();
  }

  async getEntityTitles(entities: EntityRecord[]) {
    const entityTitles: Record<EntityTypes, Record<EntityId, string>> = {
      [EntityTypes.Note]: {},
      [EntityTypes.Memo]: {},
      [EntityTypes.Material]: {},
    };

    const entitiesGroup = groupBy(entities, 'entityType');

    for (const [type, records] of Object.entries(entitiesGroup)) {
      const ids = records.map(({ entityId }) => entityId);
      const _type = Number(type) as EntityTypes;

      if (_type === EntityTypes.Note) {
        const notes = await this.notes.findAll({ id: ids });
        entityTitles[_type] = mapValues(buildIndex(notes), normalizeNoteTitle);
      }

      if (_type === EntityTypes.Material) {
        const materials = await this.materials.findAll({ id: ids });
        entityTitles[_type] = mapValues(buildIndex(materials), normalizeMaterialTitle);
      }

      if (_type === EntityTypes.Memo) {
        const memos = await this.memos.findAll({ id: ids });
        entityTitles[_type] = mapValues(buildIndex(memos), digest);
      }
    }

    return entityTitles;
  }
}
