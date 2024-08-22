import { differenceWith, uniq } from 'lodash-es';
import assert from 'node:assert';
import { container } from 'tsyringe';

import { RecyclableVO, RecycleReason } from '@domain/server/model/recyclables.js';
import type { EntityId } from '@domain/shared/model/entity.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

export default class RecyclableService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  public async batchCreate(entityIds: EntityId[]) {
    await this.entityService.assertAvailableIds(entityIds);

    const descantIds = Object.values(await this.repo.entities.findDescendantIds(entityIds)).flat();
    const records = await this.repo.recyclables.findAll({ entityIds: uniq([...entityIds, ...descantIds]) });

    const recordsToCreate = [
      ...entityIds.map((entityId) => ({ entityId, deletedAt, reason: RecycleReason.Direct })),
      ...descantIds.map((entityId) => ({ entityId, deletedAt, reason: RecycleReason.Cascade })),
    ];

    const deletedAt = Date.now();

    const newRecyclables = differenceWith(
      recordsToCreate,
      records,
      ({ entityId }, recyclable) => entityId === recyclable.entityId,
    );

    await this.repo.recyclables.batchCreate(newRecyclables);
  }

  public async remove(entityId: EntityId) {
    const recyclable = await this.repo.recyclables.findOneByEntityId(entityId);

    assert(recyclable && recyclable.reason === RecycleReason.Direct, `invalid entity id: ${entityId}`);
    await this.repo.recyclables.remove(entityId);
  }

  public async queryAll(): Promise<RecyclableVO[]> {
    const records = await this.repo.recyclables.findAll({ reason: RecycleReason.Direct });

    const ids = records.map(({ entityId }) => entityId);

    const [entities, paths] = await Promise.all([
      this.entityService.getEntities(ids),
      this.entityService.getPaths(ids),
    ]);

    return records.map((record) => ({
      deletedAt: record.deletedAt,
      path: paths[record.entityId]!,
      entity: entities[record.entityId]!,
    }));
  }
}
