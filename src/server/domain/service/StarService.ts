import { Injectable } from '@nestjs/common';
import differenceWith from 'lodash/differenceWith';

import { Transaction } from 'infra/Database';
import { type EntityId, EntityTypes } from 'interface/Entity';
import { normalizeTitle } from 'interface/Note';
import type { StarRecord } from 'interface/Star';
import { buildIndex } from 'utils/collection';

import BaseService from './BaseService';

@Injectable()
export default class StarService extends BaseService {
  @Transaction
  async create(type: EntityTypes, ids: EntityId[]) {
    if (ids.length === 0) {
      throw new Error('no ids');
    }

    let isAvailable: boolean;

    switch (type) {
      case EntityTypes.Note:
        isAvailable = await this.notes.areAvailable(ids);
        break;
      default:
        throw new Error('unknown type');
    }

    if (!isAvailable) {
      throw new Error('entities not available');
    }

    const existedStars = await this.stars.findAll({ entityType: type, entityId: ids });
    const newIds = differenceWith(ids, existedStars, (id, star) => id === star.entityId);

    return [...existedStars, ...(newIds.length > 0 ? await this.stars.put(type, newIds) : [])];
  }

  async query() {
    const stars = await this.stars.findAll();
    const notes = buildIndex(
      await this.notes.findAll({
        id: stars.filter(({ entityType }) => entityType === EntityTypes.Note).map(({ entityId }) => entityId),
      }),
    );

    return stars.map((star) => {
      if (star.entityType === EntityTypes.Note) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return { ...star, title: normalizeTitle(notes[star.entityId]!) };
      }

      throw new Error('unknown type');
    });
  }

  async remove(id: StarRecord['id']) {
    await this.stars.remove(id);
  }
}
