import assert from 'node:assert';

import container from '#utils/singletonContainer.js';
import type { Star, StarDTO, StarVO } from '#domain/shared/model/star.js';
import type { EntityId } from '#domain/shared/model/entity.js';
import { arrayOf } from '#utils/collection.js';
import { transactional } from '#domain/server/infra/transaction.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

export default class StarService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  @transactional
  public async create({ entityId }: StarDTO) {
    await this.entityService.assertAvailableIds([entityId]);

    const existingStars = await this.repo.stars.findOneByEntityId(entityId);
    assert(!existingStars, `${entityId} has been starred`);

    await this.repo.stars.createOne({ entityId, createdAt: Date.now() });
    const created = await this.queryOne(entityId);

    return created;
  }

  public async query() {
    const stars = await this.repo.stars.findAll({ isAvailableOnly: true });

    return (await this.toVO(stars)).sort(
      ({ createdAt: createdAt1 }, { createdAt: createdAt2 }) => createdAt2 - createdAt1,
    );
  }

  private async queryOne(entityId: EntityId) {
    const star = await this.repo.stars.findOneByEntityId(entityId);
    assert(star, `invalid star id: ${entityId}`);

    return this.toVO(star);
  }

  private async toVO(star: Star): Promise<StarVO>;
  private async toVO(stars: Star[]): Promise<StarVO[]>;
  private async toVO(stars: Star | Star[]): Promise<StarVO | StarVO[]> {
    const _stars = arrayOf(stars);
    const entitiesMap = await this.entityService.getEntities(_stars.map(({ entityId }) => entityId));

    const result = _stars.map((star) => {
      const entity = entitiesMap[star.entityId];

      assert(entity, `invalid star id: ${star.entityId}`);

      return {
        entity,
        createdAt: star.createdAt,
      };
    });

    return Array.isArray(stars) ? result : result[0]!;
  }

  @transactional
  public async remove(entityId: EntityId) {
    const star = await this.repo.stars.findOneByEntityId(entityId);
    assert(star, `star ${entityId} not exist`);

    await this.repo.stars.removeOne(entityId);
  }
}
