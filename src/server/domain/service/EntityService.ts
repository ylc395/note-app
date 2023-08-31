import { Injectable, Inject, forwardRef } from '@nestjs/common';
import groupBy from 'lodash/groupBy';
import compact from 'lodash/compact';
import mapValues from 'lodash/mapValues';

import { type EntityId, type HierarchyEntity, EntityTypes, EntityRecord, EntitiesLocator } from 'model/entity';
import { normalizeTitle as normalizeNoteTitle } from 'model/note';
import { normalizeTitle as normalizeMaterialTitle } from 'model/material';
import { digest } from 'model/memo';
import type { TreeNodeVO } from 'model/abstract/Tree';
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

  async assertAvailableEntities({ type, ids }: EntitiesLocator) {
    switch (type) {
      case EntityTypes.Note:
        return this.noteService.assertAvailableIds(ids);
      case EntityTypes.Material:
        return this.materialService.assertAvailableIds(ids);
      case EntityTypes.Memo:
        return this.memoService.assertAvailableIds(ids);
      default:
        throw new Error('invalid type');
    }
  }

  async assertValidParents(type: EntityTypes, changeSet: HierarchyEntity[]) {
    const parentIds = compact(changeSet.map(({ parentId }) => parentId));
    await this.assertAvailableEntities({ type, ids: parentIds });

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

  async getDescants({ type, ids }: EntitiesLocator) {
    const descants = Object.values(await this.getDescantsOfType(type, ids));
    return descants.flat();
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

  static getTree<T extends HierarchyEntity>(roots: T[], descants: T[]) {
    const childrenGroup = groupBy(descants, 'parentId');

    const getChildrenNodes = (entities: T[]): TreeNodeVO<T>[] =>
      entities.map((entity) => {
        const children = childrenGroup[entity.id];
        return { entity, children: children ? getChildrenNodes(children) : undefined };
      });

    return getChildrenNodes(roots);
  }
}
