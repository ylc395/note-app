import { Inject, Injectable } from '@nestjs/common';
import differenceWith from 'lodash/differenceWith';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';

import { Transaction } from 'infra/Database';
import { type EntityId, EntityTypes } from 'interface/entity';
import { normalizeTitle } from 'interface/note';
import type { StarRecord } from 'interface/star';
import { buildIndex } from 'utils/collection';

import BaseService from './BaseService';
import NoteService from './NoteService';

@Injectable()
export default class StarService extends BaseService {
  @Inject() private readonly noteService!: NoteService;

  @Transaction
  async create(type: EntityTypes, ids: EntityId[]) {
    if (ids.length === 0) {
      throw new Error('no ids');
    }

    let isAvailable: boolean;

    switch (type) {
      case EntityTypes.Note:
        isAvailable = await this.noteService.areAvailable(ids);
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
    const starGroups: Record<EntityTypes, StarRecord[]> = {
      [EntityTypes.Note]: [],
      [EntityTypes.Memo]: [],
      ...groupBy(stars, 'entityType'),
    };
    const idGroups: Record<EntityTypes, StarRecord['entityId'][]> = mapValues(starGroups, (records) =>
      records.map((record) => record.entityId),
    );

    const recyclableGroups: Record<EntityTypes, Record<string, boolean>> = {
      [EntityTypes.Note]: await this.recyclables.areRecyclable(EntityTypes.Note, idGroups[EntityTypes.Note]),
      [EntityTypes.Memo]: await this.recyclables.areRecyclable(EntityTypes.Memo, idGroups[EntityTypes.Memo]),
    };

    const notes = buildIndex(await this.notes.findAll({ id: idGroups[EntityTypes.Note] }));

    return stars
      .filter(({ entityType, entityId }) => !recyclableGroups[entityType][entityId])
      .map((star) => {
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
    await this.stars.remove(id);
  }
}
