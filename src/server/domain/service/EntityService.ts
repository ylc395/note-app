import { Injectable, Inject, forwardRef } from '@nestjs/common';
import groupBy from 'lodash/groupBy';
import intersectionBy from 'lodash/intersectionBy';

import { type EntityId, EntityTypes, EntityRecord, EntitiesLocator, EntityLocator } from 'model/entity';

import BaseService from './BaseService';
import NoteService from './NoteService';
import MaterialService from './MaterialService';
import MemoService from './MemoService';
import { getIds } from 'utils/collection';

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

  async getDescants({ type, ids }: EntitiesLocator) {
    let descants: Record<EntityId, EntityId[]> = {};

    switch (type) {
      case EntityTypes.Note:
        descants = await this.repo.notes.findDescendantIds(ids);
        break;
      case EntityTypes.Material:
        descants = await this.repo.materials.findDescendantIds(ids);
        break;
      case EntityTypes.Memo:
        descants = await this.repo.memos.findDescendantIds(ids);
        break;
      default:
        break;
    }

    return Object.values(descants).flat();
  }

  async filterAvailable<T extends EntityLocator>(entities: T[]) {
    const entitiesGroup = groupBy(entities, 'type');
    const result: T[] = [];

    for (const [type, _entities] of Object.entries(entitiesGroup)) {
      const ids = getIds(_entities);
      let availables: { id: string }[];

      switch (Number(type)) {
        case EntityTypes.Note:
          availables = await this.repo.notes.findAll({ id: ids, isAvailable: true });
          break;
        case EntityTypes.Material:
          availables = await this.repo.materials.findAll({ id: ids, isAvailable: true });
          break;
        case EntityTypes.Memo:
          availables = await this.repo.memos.findAll({ id: ids, isAvailable: true });
          break;
        default:
          throw new Error('unsupported type');
      }

      result.push(...intersectionBy(_entities, availables, 'id'));
    }

    return result;
  }

  async getEntityTitles(entities: EntityRecord[]) {
    const entityTitles: Record<EntityTypes, Record<EntityId, string>> = {
      [EntityTypes.Note]: {},
      [EntityTypes.Memo]: {},
      [EntityTypes.Material]: {},
      [EntityTypes.MaterialAnnotation]: {},
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
