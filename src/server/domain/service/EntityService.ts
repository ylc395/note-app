import { constant, mapValues, uniq, zipObject } from 'lodash-es';
import { singleton } from 'tsyringe';
import assert from 'assert';

import { type EntityId, type EntityLocator, EntityTypes } from '@domain/model/entity.js';
import BaseService from './BaseService.js';
import { normalizeTitle as normalizeNoteTitle } from '@domain/model/note.js';
import { normalizeTitle as normalizeMaterialTitle } from '@domain/model/material.js';
import { normalizeTitle as normalizeMemoTitle } from '@domain/model/memo.js';

@singleton()
export default class EntityService extends BaseService {
  private static readonly titleMappers = {
    [EntityTypes.Note]: normalizeNoteTitle,
    [EntityTypes.Material]: normalizeMaterialTitle,
    [EntityTypes.Memo]: normalizeMemoTitle,
    [EntityTypes.Annotation]: constant(''),
  };

  public async assertAvailableIds(ids: EntityId[], params?: { types: EntityTypes[] }) {
    ids = uniq(ids);
    const entities = await this.repo.entities.findAllAvailable(ids, params);
    assert(entities.length === ids.length, 'invalid entity ids');
  }

  public async getNormalizedTitles(entityIds: EntityId[]) {
    const entities = await this.repo.entities.findAllAvailable(entityIds);
    const titles = entities.map((entity) => EntityService.titleMappers[entity.type](entity));

    return zipObject(
      entities.map(({ id }) => id),
      titles,
    ) as Record<EntityId, string>;
  }

  public async getPath(id: EntityId) {
    const path = (await this.getPaths([id]))[id];

    assert(path);
    return path;
  }

  public async getPaths(ids: EntityId[]) {
    await this.assertAvailableIds(ids);
    const ancestors = await this.repo.entities.findAncestors(ids);

    const paths = mapValues(ancestors, (entities) =>
      entities.map((entity) => ({
        id: entity.id,
        title: EntityService.titleMappers[entity.type](entity),
        icon: entity.icon,
      })),
    );

    return paths;
  }

  public static toIds(locators: EntityLocator[]) {
    return locators.map(({ entityId }) => entityId);
  }
}
