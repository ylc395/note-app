import { Inject, Injectable, forwardRef } from '@nestjs/common';
import differenceWith from 'lodash/differenceWith';
import groupBy from 'lodash/groupBy';

import { EntityTypes, EntityLocator } from 'interface/entity';
import { normalizeTitle } from 'interface/note';
import type { StarRecord } from 'interface/star';
import { buildIndex } from 'utils/collection';

import BaseService from './BaseService';
import NoteService from './NoteService';

@Injectable()
export default class StarService extends BaseService {
  @Inject(forwardRef(() => NoteService)) private readonly noteService!: NoteService;

  async create(entities: EntityLocator[]) {
    const existedStars = await this.stars.findAllByLocators(entities);

    if (existedStars.length > 0) {
      throw new Error('already exist');
    }

    const groups = groupBy(entities, 'type');

    for (const [type, entitiesOfType] of Object.entries(groups)) {
      let isAvailable: boolean;
      const ids = entitiesOfType.map(({ id }) => id);

      switch (Number(type)) {
        case EntityTypes.Note:
          isAvailable = await this.noteService.areAvailable(ids);
          break;
        default:
          throw new Error('unknown type');
      }

      if (!isAvailable) {
        throw new Error('entities not available');
      }
    }

    return await this.stars.create(entities);
  }

  async query() {
    const stars = await this.stars.findAllByLocators();
    const recyclables = await this.recyclables.findAllByLocators(
      stars.map(({ entityId: id, entityType: type }) => ({ id, type })),
    );
    const availableStars = differenceWith(stars, recyclables, (starRecord, recyclableRecord) => {
      return starRecord.entityType === recyclableRecord.entityType && starRecord.entityId === recyclableRecord.entityId;
    });

    const starGroups = groupBy(availableStars, 'entityType');
    const notes = starGroups[EntityTypes.Note]
      ? buildIndex(await this.notes.findAll({ id: starGroups[EntityTypes.Note].map(({ entityId }) => entityId) }))
      : {};

    return availableStars.map((star) => {
      switch (star.entityType) {
        case EntityTypes.Note:
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return { ...star, title: normalizeTitle(notes[star.entityId]!) };
        default:
          throw new Error('unknown type');
      }
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
