// import { differenceWith, isMatch } from 'lodash-es';
// import assert from 'node:assert';
import { container } from 'tsyringe';

// import { RecycleReason } from '@domain/model/recyclables.js';
// import type { EntityId, EntityTypes } from '@domain/model/entity.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

export default class RecyclableService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  // async create(entities: EntityId[]) {
  //   await this.entityService.assertEntityIds(entities);

  //   const descantIds = await this.repo.entities.findDescendantIds(entities);
  //   const descants = Object.entries(descantIds)
  //     .map(([type, ids]) => EntityService.getLocators(Object.values(ids).flat(), Number(type) as EntityTypes))
  //     .flat();

  //   const deletedAt = Date.now();
  //   const recyclables = await this.repo.recyclables.findAllByLocators([...entities, ...descants]);
  //   const newRecyclables = differenceWith(
  //     [
  //       ...entities.map((entity) => ({ ...entity, deletedAt, reason: RecycleReason.Direct })),
  //       ...descants.map((entity) => ({ ...entity, deletedAt, reason: RecycleReason.Cascade })),
  //     ],
  //     recyclables,
  //     isMatch,
  //   );

  //   await this.repo.recyclables.batchCreate(newRecyclables);
  // }

  // async remove(entity: RecyclableEntityLocator) {
  //   if ((await this.repo.recyclables.findAllByLocators([entity], RecycleReason.Direct)).length === 0) {
  //     throw new Error('invalid entity');
  //   }

  //   await this.repo.recyclables.batchRemove([entity]);
  // }

  // async query() {
  //   const records = await this.repo.recyclables.findAll(RecycleReason.Direct);
  //   const titles = await this.entityService.getNormalizedTitles(records);

  //   return records.map((record) => {
  //     const title = titles[record.entityId];
  //     assert(title);

  //     return { ...record, title };
  //   });
  // }
}
