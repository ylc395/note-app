import assert from 'node:assert';
import { container, singleton } from 'tsyringe';
import { first } from 'lodash-es';

import { buildIndex } from '@utils/collection.js';
import type { StarDTO } from '@domain/shared/model/star.js';
import { EntityTypes, type EntityId } from '@domain/shared/model/entity.js';
import { isEntityMaterial } from '@domain/server/model/material.js';
import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class StarService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  public async create({ entityId }: StarDTO) {
    await this.entityService.assertAvailableIds([entityId]);

    const existingStars = await this.repo.stars.findAll({ entityId: [entityId] });
    assert(existingStars.length === 0, `${entityId} has been starred`);

    await this.repo.stars.createOne(entityId);

    const created = first(await this.query(entityId));
    assert(created);

    return created;
  }

  public async query(id?: EntityId) {
    const stars = await this.repo.stars.findAll({ isAvailableOnly: true, entityId: id ? [id] : undefined });
    const titles = await this.entityService.getNormalizedTitles(EntityService.toIds(stars));
    const materialIds = EntityService.toIds(stars.filter(({ entityType }) => entityType === EntityTypes.Material));
    const materials = materialIds.length > 0 ? buildIndex(await this.repo.materials.findAll({ id: materialIds })) : {};

    return stars.map((star) => {
      const title = titles[star.entityId] || '';
      const material = materials[star.entityId];

      return {
        ...star,
        mimeType: material && isEntityMaterial(material) ? material.mimeType : undefined,
        title,
      };
    });
  }

  public async remove({ entityId }: StarDTO) {
    assert((await this.repo.stars.findAll({ entityId: [entityId] })).length > 0);
    await this.repo.stars.removeOne(entityId);
  }
}
