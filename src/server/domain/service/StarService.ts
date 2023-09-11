import { Inject, Injectable, forwardRef } from '@nestjs/common';

import type { EntitiesLocator } from 'model/entity';
import type { StarRecord } from 'model/star';
import { getLocators } from 'utils/collection';

import BaseService from './BaseService';
import EntityService from './EntityService';

@Injectable()
export default class StarService extends BaseService {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  async create({ type, ids }: EntitiesLocator) {
    await this.entityService.assertAvailableEntities({ type, ids });

    const locators = getLocators(ids, type);

    if ((await this.stars.findAllByLocators(locators)).length > 0) {
      throw new Error('already exist');
    }

    return await this.stars.batchCreate(locators);
  }

  async query() {
    const stars = await this.stars.findAllByLocators(undefined, { isAvailable: true });
    const titles = await this.entityService.getEntityTitles(stars);

    return stars.map((star) => {
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
}
