import { Injectable, Inject, forwardRef } from '@nestjs/common';

import type { EntityLocator } from 'interface/entity';
import { Events } from 'model/events';

import BaseService from './BaseService';
import EntityService from './EntityService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  async create(entities: EntityLocator[]) {
    await this.entityService.assertAvailableEntities(entities);

    const result = await this.recyclables.create(entities);
    this.eventEmitter.emit(Events.RecyclablesCreated, entities);

    return result;
  }

  async areRecyclables(entities: EntityLocator[]) {
    return (await this.recyclables.findAllByLocators(entities)).length > 0;
  }
}
