import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { groupBy, intersectionWith } from 'lodash-es';

import {
  type EntityId,
  type EntityLocator,
  EntityTypes,
  type Path,
  HierarchyEntityLocator,
} from '@domain/model/entity.js';
import BaseService from './BaseService.js';
import NoteService from './NoteService.js';
import MaterialService from './MaterialService.js';
import MemoService from './MemoService.js';

type MainEntityLocator = EntityLocator<
  EntityTypes.Note | EntityTypes.Memo | EntityTypes.Material | EntityTypes.MaterialAnnotation
>;

@Injectable()
export default class EntityService extends BaseService implements OnModuleInit {
  @Inject() private readonly noteService!: NoteService;
  @Inject() private readonly materialService!: MaterialService;
  @Inject() private readonly memoService!: MemoService;

  public onModuleInit() {
    this.assertAvailableEntities = EntityService.doByEntityType({
      [EntityTypes.Note]: this.noteService.assertAvailableIds,
      [EntityTypes.Material]: this.materialService.assertAvailableIds,
      [EntityTypes.Memo]: this.memoService.assertAvailableIds,
      [EntityTypes.MaterialAnnotation]: () => Promise.resolve(),
    });

    this.getNormalizedTitles = EntityService.mergeMapByEntityType({
      [EntityTypes.Note]: this.noteService.getNormalizedTitles,
      [EntityTypes.Material]: this.materialService.getNormalizedTitles,
      [EntityTypes.Memo]: this.memoService.getTitles,
      [EntityTypes.MaterialAnnotation]: () => Promise.resolve({} as Record<string, string>),
    });

    this.getPaths = EntityService.mergeMapByEntityType({
      [EntityTypes.Note]: this.noteService.getPaths,
      [EntityTypes.Material]: this.materialService.getPaths,
      [EntityTypes.Memo]: () => Promise.resolve({} as Record<string, Path>),
    });
  }

  public assertAvailableEntities!: (locators: MainEntityLocator[]) => Promise<void>;
  public getNormalizedTitles!: (locators: MainEntityLocator[]) => Promise<Record<EntityId, string>>;
  public getPaths!: (locators: HierarchyEntityLocator[]) => Promise<Record<EntityId, Path>>;

  private static mergeMapByEntityType<T extends EntityTypes, R>(mappers: Record<T, (ids: EntityId[]) => Promise<R>>) {
    return async (locators: EntityLocator<T>[]) => {
      const groups = groupBy(locators, 'entityType');
      const tasks = Object.entries(groups).map(([type, locators]) => {
        const mapper = mappers[Number(type) as T];
        const ids = EntityService.toIds(locators);
        return mapper(ids);
      });

      const results = await Promise.all(tasks);
      return Object.assign({}, ...results) as R;
    };
  }

  private static doByEntityType<T extends EntityTypes>(mappers: Record<T, (ids: EntityId[]) => Promise<void>>) {
    return async (locators: EntityLocator<T>[]) => {
      const groups = groupBy(locators, 'entityType');
      const tasks = Object.entries(groups).map(([type, locators]) => {
        const mapper = mappers[Number(type) as T];
        const ids = EntityService.toIds(locators);
        return mapper(ids);
      });

      await Promise.all(tasks);
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
