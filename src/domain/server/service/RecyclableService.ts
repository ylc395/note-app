import { differenceWith, uniq } from 'lodash-es';
import assert from 'node:assert';
import { container, singleton } from 'tsyringe';

import { RecyclablesDTO, RecyclableVO } from '#domain/server/model/recyclable.js';
import type { EntityId } from '#domain/shared/model/entity.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class RecyclableService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  @BaseService.transaction()
  public async batchCreate(recyclables: RecyclablesDTO) {
    const entityIds = recyclables.map(({ entityId }) => entityId);
    await this.entityService.assertAvailableIds(entityIds);

    const descantIds = Object.values(await this.repo.entities.findDescendantIds(entityIds)).flat();
    const records = await this.repo.recyclables.findAll({ entityIds: uniq([...entityIds, ...descantIds]) });
    const createdAt = Date.now();

    const recordsToCreate = [
      ...entityIds.map((entityId) => ({ entityId, createdAt })),
      ...descantIds.map((entityId) => ({ entityId, createdAt })),
    ];

    const newRecyclables = differenceWith(
      recordsToCreate,
      records,
      ({ entityId }, recyclable) => entityId === recyclable.entityId,
    );

    await this.repo.recyclables.batchCreate(newRecyclables);
  }

  @BaseService.transaction()
  public async recover(entityId: EntityId) {
    const recyclable = await this.repo.recyclables.findOneByEntityId(entityId);
    assert(recyclable, `invalid entity id: ${entityId}`);

    const ancestors = await this.repo.entities.findAncestors(recyclable.entityId);
    const ancestorRecyclables = await this.repo.recyclables.findAll({ entityIds: ancestors.map(({ id }) => id) });

    assert(ancestorRecyclables.length === 0, 'can not recover a descant recyclable');

    await this.repo.recyclables.removeByEntityId(entityId);
  }

  @BaseService.transaction()
  public async queryAll(): Promise<RecyclableVO[]> {
    const records = await this.repo.recyclables.findAll();
    const ids = records.map(({ entityId }) => entityId);

    const [entities, paths] = await Promise.all([
      this.entityService.getEntities(ids),
      this.entityService.getPaths(ids),
    ]);

    return records.map((record) => ({
      createdAt: record.createdAt,
      path: paths[record.entityId]!,
      entity: entities[record.entityId]!,
    }));
  }
}
