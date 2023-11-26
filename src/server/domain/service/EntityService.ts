import assert from 'node:assert';
import { Injectable } from '@nestjs/common';
import uniq from 'lodash/uniq';
import groupBy from 'lodash/groupBy';
import intersectionWith from 'lodash/intersectionWith';
import mapValues from 'lodash/mapValues';
import isMatch from 'lodash/isMatch';

import { type EntityId, type EntityLocator, EntityTypes, HierarchyEntityLocator } from 'model/entity';
import BaseService from './BaseService';
import { buildIndex } from 'utils/collection';
import { normalizeTitle as normalizeNoteTitle } from 'model/note';
import { normalizeTitle as normalizeMaterialTitle } from 'model/material';
import { normalizeTitle as normalizeMemoTitle } from 'model/memo';

type TitleEntityTypes = EntityTypes.Note | EntityTypes.Material | EntityTypes.Memo | EntityTypes.MaterialAnnotation;

const titleTransformers = {
  [EntityTypes.Note]: normalizeNoteTitle,
  [EntityTypes.Material]: normalizeMaterialTitle,
  [EntityTypes.Memo]: normalizeMemoTitle,
  [EntityTypes.MaterialAnnotation]: () => 'annotation',
};

@Injectable()
export default class EntityService extends BaseService {
  async assertAvailableEntities(locators: EntityLocator[]) {
    const groups = groupBy(locators, 'entityType');

    for (const [type, locators] of Object.entries(groups)) {
      await this.assertAvailableIds(Number(type) as EntityTypes, EntityService.toIds(locators));
    }
  }

  async getTitles(locators: EntityLocator<TitleEntityTypes>[]) {
    const groups = groupBy(locators, 'entityType');
    const result: Record<EntityId, string> = {};

    for (const [type, locators] of Object.entries(groups)) {
      const entityType = Number(type) as TitleEntityTypes;
      const entities = await this.getRepo(entityType).findAll({
        id: EntityService.toIds(locators),
      });

      for (const entity of entities) {
        result[entity.id] = titleTransformers[entityType](entity);
      }
    }

    return result;
  }

  async getPaths(locators: HierarchyEntityLocator[]) {
    const groups = groupBy(locators, 'entityType');
    let result: Record<EntityId, { title: string; id: string }[]> = {};

    for (const [type, locators] of Object.entries(groups)) {
      const entityType = Number(type) as HierarchyEntityLocator['entityType'];
      const ids = EntityService.toIds(locators);
      const ancestorIds = await this.getRepo(entityType).findAncestorIds(ids);
      const notes = buildIndex(await this.repo.notes.findAll({ id: Object.values(ancestorIds).flat() }));
      const titles = mapValues(ancestorIds, (ids) =>
        ids.map((id) => ({ id, title: titleTransformers[entityType](notes[id]!) })),
      );

      result = { ...result, ...titles };
    }

    return result;
  }

  async assertAvailableIds(entityType: EntityTypes, ids: EntityId[]) {
    const uniqueIds = uniq(ids);
    const rows = await this.getRepo(entityType).findAll({ id: uniqueIds, isAvailable: true });

    assert(rows.length === uniqueIds.length, 'unavailable ids');
  }

  async filterAvailable<T extends EntityLocator>(locators: T[]) {
    const groups = groupBy(locators, 'entityType');
    let availableLocators: EntityLocator[] = [];

    for (const [type, locators] of Object.entries(groups)) {
      const entityType = Number(type) as EntityTypes;
      const rows = await this.getRepo(entityType).findAll({
        id: EntityService.toIds(locators),
        isAvailable: true,
      });

      availableLocators = availableLocators.concat(EntityService.getLocators(rows, entityType));
    }

    return intersectionWith(locators, availableLocators, isMatch);
  }

  private getRepo(entityType: EntityTypes) {
    switch (entityType) {
      case EntityTypes.Note:
        return this.repo.notes;
      case EntityTypes.Material:
        return this.repo.materials;
      default:
        assert.fail('invalid type');
    }
  }

  static getLocators<T extends { id: EntityId }, E extends EntityTypes>(entities: T[] | EntityId[], type: E) {
    return entities.map((v) => ({ entityId: typeof v === 'string' ? v : v.id, entityType: type }));
  }

  static toIds(locators: EntityLocator[]) {
    return locators.map(({ entityId }) => entityId);
  }
}
