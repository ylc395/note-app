import { groupBy, intersectionWith, uniq } from 'lodash-es';
import { container, singleton } from 'tsyringe';
import assert from 'assert';

import { type EntityId, type EntityLocator, EntityTypes } from '@domain/model/entity.js';
import BaseService from './BaseService.js';
import NoteService from './NoteService.js';
import MaterialService from './MaterialService.js';
import MemoService from './MemoService.js';

@singleton()
export default class EntityService extends BaseService {
  private readonly noteService = container.resolve(NoteService);
  private readonly materialService = container.resolve(MaterialService);
  private readonly memoService = container.resolve(MemoService);

  public readonly assertEntityIds = async (ids: EntityId[]) => {
    ids = uniq(ids);
    const availableIds = await this.repo.entities.findAllAvailable(ids);
    assert(availableIds.length === ids.length, 'invalid entity ids');
  };

  public readonly getNormalizedTitles = EntityService.mergeMapByEntityType({
    [EntityTypes.Note]: this.noteService.getNormalizedTitles,
    [EntityTypes.Material]: this.materialService.getNormalizedTitles,
    [EntityTypes.Memo]: this.memoService.getTitles,
  });

  public readonly getPaths = EntityService.mergeMapByEntityType({
    [EntityTypes.Note]: this.noteService.getPaths,
    [EntityTypes.Material]: this.materialService.getPaths,
  });

  private static mergeMapByEntityType<T extends EntityTypes, R>(mappers: Record<T, (ids: EntityId[]) => Promise<R>>) {
    return async (locators: EntityLocator[]) => {
      const groups = groupBy(locators, 'entityType');
      const tasks = Object.entries(groups).map(([type, locators]) => {
        const mapper = mappers[Number(type) as T];
        const ids = EntityService.toIds(locators);
        return mapper?.(ids) || {};
      });

      const results = await Promise.all(tasks);
      return Object.assign({}, ...results) as R;
    };
  }

  async filterAvailable<T extends EntityLocator>(locators: T[]) {
    const ids = await this.repo.entities.findAllAvailable(EntityService.toIds(locators));
    return intersectionWith(locators, ids, ({ entityId }, id) => entityId === id);
  }

  public static getLocators<T extends { id: EntityId }, E extends EntityTypes>(entities: T[] | EntityId[], type: E) {
    return entities.map((v) => ({ entityId: typeof v === 'string' ? v : v.id, entityType: type }));
  }

  public static toIds(locators: EntityLocator[]) {
    return locators.map(({ entityId }) => entityId);
  }
}
