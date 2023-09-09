import { Injectable, Inject, forwardRef } from '@nestjs/common';
import groupBy from 'lodash/groupBy';

import { type EntityId, EntityTypes, EntityRecord, EntitiesLocator } from 'model/entity';

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
      let titles: Record<EntityId, string>;

      switch (Number(type)) {
        case EntityTypes.Note:
          titles = await this.noteService.getTitles(ids);
          break;
        case EntityTypes.Material:
          titles = await this.materialService.getTitles(ids);
          break;
        case EntityTypes.Memo:
          titles = await this.memoService.getDigest(ids);
          break;
        default:
          throw new Error('invalid type');
      }

      entityTitles[Number(type) as EntityTypes] = titles;
    }

    return entityTitles;
  }
}
