import { constant, mapValues, pick, uniq } from 'lodash-es';
import { singleton } from 'tsyringe';
import assert from 'assert';

import { Entity, type EntityId, EntityTypes } from '#domain/shared/model/entity.js';
import BaseService from './BaseService.js';
import { normalizeTitle as normalizeNoteTitle } from '#domain/shared/model/note.js';
import { normalizeTitle as normalizeMaterialTitle } from '#domain/shared/model/material.js';
import { normalizeTitle as normalizeMemoTitle } from '#domain/server/model/memo.js';
import { buildIndex } from '#utils/collection.js';

@singleton()
export default class EntityService extends BaseService {
  public static getReadableTitle(entity: Entity) {
    const mappers = {
      [EntityTypes.Note]: normalizeNoteTitle,
      [EntityTypes.Material]: normalizeMaterialTitle,
      [EntityTypes.Memo]: normalizeMemoTitle,
      [EntityTypes.Annotation]: constant(''),
    };

    return mappers[entity.type](entity);
  }

  public async assertAvailableIds(ids: EntityId[]) {
    ids = uniq(ids);
    const entities = await this.repo.entities.findAll({ ids, isAvailableOnly: true });

    assert(entities.length === ids.length, 'invalid entity ids');
  }

  public async getEntities(entityIds: EntityId[]) {
    const entities = await this.repo.entities.findAll({ ids: entityIds });
    const entitiesGroup = Object.groupBy(entities, ({ type }) => type);
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
        file: files[entity.id],
        main: main && {
          ...pick(main, ['id', 'icon', 'createdAt', 'updatedAt', 'title']),
          type: EntityTypes.Material,
          body: main.body,
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
    const ancestors = await this.repo.entities.findAncestors(ids);
    const paths = mapValues(ancestors, (entities) =>
      entities.map((entity) => ({
        id: entity.id,
        title: EntityService.getReadableTitle(entity),
        icon: entity.icon,
      })),
    );

    return paths;
  }
}
