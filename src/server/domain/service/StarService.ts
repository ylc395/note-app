import { Inject, Injectable, forwardRef } from '@nestjs/common';

import type { EntityLocator } from 'model/entity';
import type { StarRecord } from 'model/star';

import BaseService from './BaseService';
import EntityService from './EntityService';
import RecyclableService from './RecyclableService';

@Injectable()
export default class StarService extends BaseService {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;
  @Inject(forwardRef(() => RecyclableService)) private readonly recyclableService!: RecyclableService;

  async create(entities: EntityLocator[]) {
    await this.entityService.assertAvailableEntities(entities);

    if ((await this.stars.findAllByLocators(entities)).length > 0) {
      throw new Error('already exist');
    }

    return await this.stars.batchCreate(entities);
  }

  async query() {
    const stars = await this.stars.findAllByLocators();
    const availableStars = await this.recyclableService.filterByLocators(stars, ({ entityId, entityType }) => ({
      id: entityId,
      type: entityType,
    }));

    const titles = await this.entityService.getEntityTitles(availableStars);

    return availableStars.map((star) => {
      const title = titles[star.entityType][star.entityId];

      if (!title) {
        throw new Error('no title');
      }
      return { ...star, title };
    });
  }

  async remove(id: StarRecord['id']) {
    if (!(await this.stars.findOneById(id))) {
      throw new Error('invalid id');
    }

    await this.stars.remove(id);
  }

  async isStar(entity: EntityLocator) {
    const stars = await this.stars.findAllByLocators([entity]);
    return stars.length > 0;
  }
}
