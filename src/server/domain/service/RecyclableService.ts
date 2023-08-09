import { Injectable, Inject, forwardRef } from '@nestjs/common';
import omit from 'lodash/omit';
import differenceWith from 'lodash/differenceWith';

import type { EntityLocator, EntityId, EntityTypes } from 'interface/entity';

import BaseService from './BaseService';
import EntityService from './EntityService';
import { RecycleReason } from 'interface/recyclables';
import { getIds } from 'utils/collection';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  async create(entities: EntityLocator[]) {
    await this.entityService.assertAvailableEntities(entities);
    const descants = await this.entityService.getDescants(entities);
    const recyclables = await this.recyclables.findAllByLocators([...entities, ...descants]);

    const newRecyclables = differenceWith(
      [
        ...entities.map((entity) => ({ ...entity, reason: RecycleReason.Direct })),
        ...descants.map((entity) => ({ ...entity, reason: RecycleReason.Cascade })),
      ],
      recyclables,
      ({ type, id }, { entityId, entityType }) => id === entityId && type === entityType,
    );

    const result = await this.recyclables.batchCreate(newRecyclables);
    return result.filter((record) => record.reason === RecycleReason.Direct).map((record) => omit(record, ['reason']));
  }

  async filter<T extends { id: EntityId }>(type: EntityTypes, entities: T[]) {
    const ids = getIds(entities);
    const recyclables = await this.recyclables.findAllByLocators(ids.map((id) => ({ id, type })));
    return differenceWith(entities, recyclables, ({ id }, recyclable) => id === recyclable.entityId);
  }
}
