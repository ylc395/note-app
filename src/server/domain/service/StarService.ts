import assert from 'node:assert';
import { container, singleton } from 'tsyringe';
import { first } from 'lodash-es';

import type { StarDTO } from '@domain/model/star.js';
import type { EntityId } from '@domain/model/entity.js';
import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class StarService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  public async create({ entityId }: StarDTO) {
    await this.entityService.assertEntityIds([entityId]);

    const existingStars = await this.repo.stars.findAll({ entityId: [entityId] });
    assert(existingStars.length === 0, `${entityId} has been starred`);

    await this.repo.stars.createOne(entityId);

    const created = first(await this.query(entityId));
    assert(created);

    return created;
  }

  public async query(id?: EntityId) {
    const stars = await this.repo.stars.findAll({ isAvailableOnly: true, entityId: id ? [id] : undefined });
    const titles = await this.entityService.getNormalizedTitles(stars);

    return stars.map((star) => {
      const title = titles[star.entityId] || '';
      return { ...star, title };
    });
  }

  public async remove({ entityId }: StarDTO) {
    assert((await this.repo.stars.findAll({ entityId: [entityId] })).length > 0);
    await this.repo.stars.removeOne(entityId);
  }
}
