import { Injectable, Inject, forwardRef } from '@nestjs/common';
import omit from 'lodash/omit';
import differenceWith from 'lodash/differenceWith';
import mapValues from 'lodash/mapValues';

import type { EntityLocator, EntityId, EntityTypes, EntitiesLocator } from 'model/entity';
import { RecycleReason } from 'model/recyclables';
import { getIds, getLocators } from 'utils/collection';

import BaseService from './BaseService';
import EntityService from './EntityService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  async create({ type, ids }: EntitiesLocator) {
    await this.entityService.assertAvailableEntities({ type, ids });
    const descants = await this.entityService.getDescants({ type, ids });
    const recyclables = await this.recyclables.findAllByLocators(getLocators([...ids, ...descants], type));

    const newRecyclables = differenceWith(
      [
        ...ids.map((id) => ({ id, type, reason: RecycleReason.Direct })),
        ...descants.map((id) => ({ id, type, reason: RecycleReason.Cascade })),
      ],
      recyclables,
      ({ type, id }, { entityId, entityType }) => id === entityId && type === entityType,
    );

    const result = await this.recyclables.batchCreate(newRecyclables);
    const directResult = result.filter((record) => record.reason === RecycleReason.Direct);
    const titles = await this.entityService.getEntityTitles(directResult);

    return directResult.map((record) => {
      const title = titles[record.entityType][record.entityId];

      if (!title) {
        throw new Error('no title');
      }

      return {
        ...omit(record, ['reason']),
        title,
      };
    });
  }

  async query() {
    const records = await this.recyclables.findAll(RecycleReason.Direct);
    const titles = await this.entityService.getEntityTitles(records);

    return records.map((record) => {
      const title = titles[record.entityType][record.entityId];

      if (!title) {
        throw new Error('no title');
      }

      return { ...record, title };
    });
  }

  async filter<T extends { id: EntityId }>(type: EntityTypes, entities: T[]) {
    const ids = getIds(entities);
    const recyclables = await this.recyclables.findAllByLocators(ids.map((id) => ({ id, type })));
    return differenceWith(entities, recyclables, ({ id }, recyclable) => id === recyclable.entityId);
  }

  async filterByLocators<T>(
    entities: Record<string, T[]>,
    toLocator: (entity: T) => EntityLocator,
  ): Promise<Record<string, T[]>>;
  async filterByLocators<T>(entities: T[] | Record<string, T[]>, toLocator: (entity: T) => EntityLocator): Promise<T[]>;
  async filterByLocators<T>(entities: T[] | Record<string, T[]>, toLocator: (entity: T) => EntityLocator) {
    const _entities = Array.isArray(entities) ? entities : Object.values(entities).flat();
    const recyclables = await this.recyclables.findAllByLocators(_entities.map(toLocator));

    const filterOut = (e: T[]) => {
      return differenceWith(e, recyclables, (entity, recyclable) => {
        const { id, type } = toLocator(entity);

        return id === recyclable.entityId && type === recyclable.entityType;
      });
    };

    return Array.isArray(entities) ? filterOut(entities) : mapValues(entities, filterOut);
  }
}
