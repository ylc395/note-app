import assert from 'node:assert';
import { container, singleton } from 'tsyringe';

import type { StarEntityLocator, StarVO } from '@domain/model/star.js';
import type { EntityId } from '@domain/model/entity.js';
import { buildIndex } from '@utils/collection.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class StarService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  async create(entity: StarEntityLocator) {
    await this.entityService.assertAvailableEntities([entity]);

    const existingStars = await this.repo.stars.findAllByEntityId([entity.entityId]);
    assert(existingStars.length === 0);
    await this.repo.stars.createOne(entity);
  }

  async query() {
    const stars = await this.repo.stars.findAllAvailable();
    const titles = await this.entityService.getNormalizedTitles(stars);

    return stars.map((star) => {
      const title = titles[star.entityId];
      assert(title);
      return { ...star, title };
    });
  }

  async remove(id: StarVO['id']) {
    const result = await this.repo.stars.remove(id);
    assert(result);
  }

  async getStarMap(entities: EntityId[]) {
    const stars = await this.repo.stars.findAllByEntityId(entities);
    return buildIndex(stars, 'entityId');
  }
}
