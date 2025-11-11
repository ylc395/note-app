import { constant, keyBy, mapValues, pick, uniq } from 'lodash-es';
import assert from 'assert';

import { Entity, type EntityId, EntityTypes } from '#domain/shared/model/entity.js';
import BaseService from './BaseService.js';
import { normalizeTitle as normalizeNoteTitle } from '#domain/shared/model/note.js';
import { normalizeTitle as normalizeMemoTitle } from '#domain/server/model/memo.js';

export default class EntityService extends BaseService {
  private static getReadableTitle(entity: Entity) {
    const mappers = {
      [EntityTypes.Note]: normalizeNoteTitle,
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

    const notesOfAnnotations = annotationIds ? await this.repo.annotations.findAllTargets(annotationIds) : {};

    const noteIds = [
      ...(entitiesGroup[EntityTypes.Note]?.map(({ id }) => id) || []),
      ...Object.values(notesOfAnnotations).map(({ id }) => id),
    ];

    const files = await this.repo.notes.findFiles(noteIds);
    const paths = await this.getPaths(noteIds);

    const normalizedEntities: Entity[] = entities.map((entity) => {
      const main = notesOfAnnotations[entity.id];

      return {
        ...entity,
        title: EntityService.getReadableTitle(entity),
        file: files[entity.id],
        path: paths[entity.id],
        main: main && {
          ...pick(main, ['id', 'icon', 'createdAt', 'updatedAt']),
          title: normalizeNoteTitle(main),
          type: EntityTypes.Note,
          file: files[main.id],
        },
      };
    });

    return keyBy(normalizedEntities, ({ id }) => id);
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
