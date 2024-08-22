import { constant, groupBy, mapValues, pick, uniq } from 'lodash-es';
import { singleton } from 'tsyringe';
import assert from 'assert';
import { randomUUID } from 'node:crypto';

import { Entity, type EntityId, EntityTypes } from '@domain/shared/model/entity.js';
import BaseService from './BaseService.js';
import { normalizeTitle as normalizeNoteTitle } from '@domain/shared/model/note.js';
import { normalizeTitle as normalizeMaterialTitle } from '@domain/shared/model/material.js';
import { normalizeTitle as normalizeMemoTitle } from '@domain/server/model/memo.js';
import { buildIndex } from '@utils/collection.js';

@singleton()
export default class EntityService extends BaseService {
  private static readonly titleMappers = {
    [EntityTypes.Note]: normalizeNoteTitle,
    [EntityTypes.Material]: normalizeMaterialTitle,
    [EntityTypes.Memo]: normalizeMemoTitle,
    [EntityTypes.Annotation]: constant(''),
  };

  public async assertAvailableIds(ids: EntityId[]) {
    ids = uniq(ids);
    const entities = await this.repo.entities.findAll(ids, { isAvailableOnly: true });

    assert(entities.length === ids.length, 'invalid entity ids');
  }

  public async getEntities(entityIds: EntityId[]) {
    const entities = await this.repo.entities.findAll(entityIds);
    const entitiesGroup = groupBy(entities, ({ type }) => type);
    const annotationIds = entitiesGroup[EntityTypes.Annotation]?.map(({ id }) => id);

    const materialsOfAnnotations = annotationIds ? await this.repo.annotations.findAllTargets(annotationIds) : {};

    const materialIds = [
      ...(entitiesGroup[EntityTypes.Material]?.map(({ id }) => id) || []),
      ...Object.values(materialsOfAnnotations).map(({ id }) => id),
    ];

    const files = materialIds ? await this.repo.materials.findFiles(materialIds) : {};

    const normalizedEntities: Entity[] = entities.map((entity) => {
      const main = materialsOfAnnotations[entity.id];

      return {
        ...entity,
        title: EntityService.titleMappers[entity.type](entity),
        file: files[entity.id],
        main: main && {
          ...pick(main, ['id', 'icon', 'createdAt', 'updatedAt']),
          title: EntityService.titleMappers[EntityTypes.Material](main),
          type: EntityTypes.Material,
          body: main.comment,
          file: files[main.id],
        },
      };
    });

    return buildIndex(normalizedEntities);
  }

  public async getPath(id: EntityId) {
    const path = (await this.getPaths([id]))[id];

    assert(path);
    return path;
  }

  public async getPaths(ids: EntityId[]) {
    // no need to assertAvailable here. This is not a method for client.
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

  // generate id on business logic level instead of database level
  // see https://medium.com/ingeniouslysimple/why-did-we-shift-away-from-database-generated-ids-7e0e54a49bb3
  public static generateId() {
    // remove the "-" is ok
    // see https://stackoverflow.com/questions/51830845/how-safe-is-it-to-remove-the-in-a-randomly-generated-uuid
    return randomUUID().replaceAll('-', '');
  }
}
