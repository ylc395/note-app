import { Inject, Injectable, forwardRef } from '@nestjs/common';
import differenceWith from 'lodash/differenceWith';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import zipObject from 'lodash/zipObject';

import { type EntityId, EntityTypes, EntityLocator } from 'interface/entity';
import { normalizeTitle } from 'interface/note';
import type { StarRecord } from 'interface/star';
import { buildIndex } from 'utils/collection';

import BaseService from './BaseService';
import NoteService from './NoteService';
import RecyclableService from './RecyclableService';

@Injectable()
export default class StarService extends BaseService {
  @Inject(forwardRef(() => NoteService)) private readonly noteService!: NoteService;
  @Inject() private readonly recyclableService!: RecyclableService;

  private get stars() {
    return this.db.getRepository('stars');
  }

  private get notes() {
    return this.db.getRepository('notes');
  }

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
      [EntityTypes.Material]: [],
      ...groupBy(stars, 'entityType'),
    };
    const idGroups: Record<EntityTypes, StarRecord['entityId'][]> = mapValues(starGroups, (records) =>
      records.map((record) => record.entityId),
    );

    const recyclableGroups: Record<EntityTypes, Record<string, boolean>> = {
      [EntityTypes.Note]: await this.recyclableService.areRecyclables(EntityTypes.Note, idGroups[EntityTypes.Note]),
      [EntityTypes.Memo]: await this.recyclableService.areRecyclables(EntityTypes.Memo, idGroups[EntityTypes.Memo]),
      [EntityTypes.Material]: await this.recyclableService.areRecyclables(
        EntityTypes.Material,
        idGroups[EntityTypes.Material],
      ),
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

  async areStars(type: EntityTypes, ids: EntityId[]) {
    const stars = await this.stars.findAll({ entityType: type, entityId: ids });
    const index = buildIndex(stars, 'entityId');

    return zipObject(
      ids,
      ids.map((id) => Boolean(index[id])),
    );
  }

  async isStar(entity: EntityLocator) {
    const stars = await this.stars.findAll({ entityId: entity.id, entityType: entity.type });
    return stars.length > 0;
  }
}
