import { Injectable, Inject } from '@nestjs/common';
import differenceWith from 'lodash/differenceWith';
import isMatch from 'lodash/isMatch';
import assert from 'node:assert';

import { type RecyclableEntityLocator, type RecyclableEntityTypes, RecycleReason } from 'model/recyclables';

import BaseService from './BaseService';
import EntityService from './EntityService';

@Injectable()
export default class RecyclableService extends BaseService {
  @Inject() private readonly entityService!: EntityService;

  async create(entities: RecyclableEntityLocator[]) {
    await this.entityService.assertAvailableEntities(entities);

    const descantIds = await this.repo.entities.findDescendantIds(entities);
    const descants = Object.entries(descantIds)
      .map(([type, ids]) => EntityService.getLocators(Object.values(ids).flat(), Number(type) as RecyclableEntityTypes))
      .flat();

    const deletedAt = Date.now();
    const recyclables = await this.repo.recyclables.findAllByLocators([...entities, ...descants]);
    const newRecyclables = differenceWith(
      [
        ...entities.map((entity) => ({ ...entity, deletedAt, reason: RecycleReason.Direct })),
        ...descants.map((entity) => ({ ...entity, deletedAt, reason: RecycleReason.Cascade })),
      ],
      recyclables,
      isMatch,
    );

    await this.repo.recyclables.batchCreate(newRecyclables);
  }

  async remove(entity: RecyclableEntityLocator) {
    if ((await this.repo.recyclables.findAllByLocators([entity], RecycleReason.Direct)).length === 0) {
      throw new Error('invalid entity');
    }

    await this.repo.recyclables.batchRemove([entity]);
  }

  async query() {
    const records = await this.repo.recyclables.findAll(RecycleReason.Direct);
    const titles = await this.entityService.getTitles(records);

    return records.map((record) => {
      const title = titles[record.entityId];
      assert(title);

      return { ...record, title };
    });
  }
}
