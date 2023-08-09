import { Inject, Injectable, forwardRef } from '@nestjs/common';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';

import { EntityTypes, EntityLocator, EntityId } from 'model/entity';
import { normalizeTitle as normalizeNoteTitle } from 'model/note';
import { normalizeTitle as normalizeMaterialTitle } from 'model/material';
import { digest } from 'model/memo';
import type { StarRecord } from 'model/star';
import { buildIndex } from 'utils/collection';

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

    const starGroups = groupBy(availableStars, 'entityType');
    const entityTitles: Record<EntityTypes, Record<EntityId, string>> = {
      [EntityTypes.Note]: {},
      [EntityTypes.Memo]: {},
      [EntityTypes.Material]: {},
    };

    for (const [type, stars] of Object.entries(starGroups)) {
      const entityType = Number(type) as EntityTypes;
      const titles = await this.getEntityTitles(
        entityType,
        stars.map(({ entityId }) => entityId),
      );

      entityTitles[entityType] = titles;
    }

    return availableStars.map((star) => {
      return { ...star, title: entityTitles[star.entityType][star.entityId] };
    });
  }

  private async getEntityTitles(type: EntityTypes, ids: EntityId[]) {
    if (type === EntityTypes.Note) {
      const notes = await this.notes.findAll({ id: ids });
      return mapValues(buildIndex(notes), normalizeNoteTitle);
    }

    if (type === EntityTypes.Material) {
      const materials = await this.materials.findAll({ id: ids });
      return mapValues(buildIndex(materials), normalizeMaterialTitle);
    }

    if (type === EntityTypes.Memo) {
      const memos = await this.memos.findAll({ id: ids });
      return mapValues(buildIndex(memos), digest);
    }

    throw new Error('can not get title');
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
