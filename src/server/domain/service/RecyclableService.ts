import { Injectable, Inject, forwardRef } from '@nestjs/common';
import differenceWith from 'lodash/differenceWith';

import type { EntityLocator } from 'model/entity';
import { RecycleReason } from 'model/recyclables';
import { getLocators } from 'utils/collection';

import BaseService from './BaseService';
import EntityService from './EntityService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  async create(entities: EntityLocator[]) {
    await this.entityService.assertAvailableEntities(entities);

    const descantIds = await this.repo.entities.findDescendantIds(entities);
    const descants = Object.entries(descantIds)
      .map(([type, ids]) => getLocators(Object.values(ids).flat(), Number(type)))
      .flat();

    const recyclables = await this.repo.recyclables.findAllByLocators([...entities, ...descants]);
    const newRecyclables = differenceWith(
      [
        ...entities.map((entity) => ({ ...entity, reason: RecycleReason.Direct })),
        ...descants.map((entity) => ({ ...entity, reason: RecycleReason.Cascade })),
      ],
      recyclables,
      ({ entityId: id, entityType: type }, { entityId, entityType }) => id === entityId && type === entityType,
    );

    await this.repo.recyclables.batchCreate(newRecyclables);
  }

  async remove(entity: EntityLocator) {
    if ((await this.repo.recyclables.findAllByLocators([entity], RecycleReason.Direct)).length === 0) {
      throw new Error('invalid entity');
    }

    await this.repo.recyclables.batchRemove([entity]);
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
