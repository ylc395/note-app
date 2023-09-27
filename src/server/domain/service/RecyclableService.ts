import { Injectable, Inject, forwardRef } from '@nestjs/common';
import differenceWith from 'lodash/differenceWith';

import type { EntitiesLocator } from 'model/entity';
import { RecycleReason } from 'model/recyclables';
import { getLocators } from 'utils/collection';

import BaseService from './BaseService';
import EntityService from './EntityService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  async create({ entityType, entityIds }: EntitiesLocator) {
    await this.entityService.assertAvailableEntities({ entityType, entityIds });
    const descants = await this.repo.entities.findDescendantIds(entityType, entityIds);
    const recyclables = await this.repo.recyclables.findAllByLocators(
      getLocators([...entityIds, ...descants], entityType),
    );

    const newRecyclables = differenceWith(
      [
        ...entityIds.map((entityId) => ({ entityId, entityType, reason: RecycleReason.Direct })),
        ...descants.map((entityId) => ({ entityId, entityType, reason: RecycleReason.Cascade })),
      ],
      recyclables,
      ({ entityId: id, entityType: type }, { entityId, entityType }) => id === entityId && type === entityType,
    );

    const created = await this.repo.recyclables.batchCreate(newRecyclables);
    this.eventBus.emit('recyclableCreated', created);
  }

  async query() {
    const records = await this.repo.recyclables.findAll(RecycleReason.Direct);
    const titles = await this.entityService.getEntityTitles(records);

    return records.map((record) => {
      const title = titles[record.entityType][record.entityId];

      if (!title) {
        throw new Error('no title');
      }

      return { ...record, title };
    });
  }
}
