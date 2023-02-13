import { Injectable } from '@nestjs/common';
import { EntityTypes } from 'interface/Entity';

import { Transaction } from 'infra/Database';
import { normalizeTitle } from 'interface/Note';

import BaseService from './BaseService';

@Injectable()
export default class StarService extends BaseService {
  @Transaction
  async put(type: EntityTypes, ids: string[]) {
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

    return await this.stars.put(type, ids);
  }

  async query() {
    const stars = await this.stars.findAll();
    const notes = this.buildIndex(
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
}
