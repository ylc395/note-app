import { Injectable, Inject, forwardRef } from '@nestjs/common';
import differenceWith from 'lodash/differenceWith';

import type { EntityLocator, EntityId, EntityTypes } from 'interface/entity';
import { Events } from 'model/events';

import BaseService from './BaseService';
import EntityService from './EntityService';
import { getLocators } from 'utils/collection';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  async create(entities: EntityLocator[]) {
    await this.entityService.assertAvailableEntities(entities);

    const result = await this.recyclables.batchCreate(entities);
    this.eventEmitter.emit(Events.RecyclablesCreated, entities);

    return result;
  }

  async filterAvailable<T extends { id: EntityId }>(type: EntityTypes, entities: T[]) {
    const recyclables = await this.recyclables.findAllByLocators(getLocators(entities, type));
    return differenceWith(entities, recyclables, ({ id }, { entityId }) => id === entityId);
  }
}
