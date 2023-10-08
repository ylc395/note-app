import { Injectable, Inject, forwardRef } from '@nestjs/common';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import intersectionBy from 'lodash/intersectionBy';
import map from 'lodash/map';

import { type EntityId, type EntityLocator, type HierarchyEntityTypes, EntityTypes } from 'model/entity';

import BaseService from './BaseService';
import NoteService from './NoteService';
import MaterialService from './MaterialService';
import MemoService from './MemoService';

@Injectable()
export default class EntityService extends BaseService {
  @Inject(forwardRef(() => NoteService)) private readonly noteService!: NoteService;
  @Inject(forwardRef(() => MaterialService)) private readonly materialService!: MaterialService;
  @Inject(forwardRef(() => MemoService)) private readonly memoService!: MemoService;

  async assertAvailableEntities(entities: EntityLocator[]) {
    const entitiesGroup = groupBy(entities, 'entityType');

    for (const [type, _entities] of Object.entries(entitiesGroup)) {
      const ids = map(_entities, 'entityId');

      switch (Number(type)) {
        case EntityTypes.Note:
          await this.noteService.assertAvailableIds(ids);
          break;
        case EntityTypes.Material:
          await this.materialService.assertAvailableIds(ids);
          break;
        case EntityTypes.Memo:
          await this.memoService.assertAvailableIds(ids);
          break;
        default:
          throw new Error('invalid type');
      }
    }
  }

  async getPath(entities: EntityLocator[]) {
    const entitiesGroup = groupBy(entities, 'entityType');
    const ancestors: Record<HierarchyEntityTypes, Record<EntityId, EntityId[]>> = {
      [EntityTypes.Note]: {},
      [EntityTypes.Material]: {},
      [EntityTypes.Memo]: {},
    };

    for (const [type, _entities] of Object.entries(entitiesGroup)) {
      const ids = _entities.map(({ entityId }) => entityId);

      switch (Number(type)) {
        case EntityTypes.Note:
          ancestors[EntityTypes.Note] = await this.repo.notes.findAncestorIds(ids);
          break;
        case EntityTypes.Material:
          ancestors[EntityTypes.Material] = await this.repo.materials.findAncestorIds(ids);
          break;
        case EntityTypes.Memo:
          break;
        default:
          throw new Error('unsupported type');
      }
    }

    const ancestorEntities = [...Object.entries(ancestors)]
      .map(([type, ancestorIds]) =>
        Object.values(ancestorIds).flatMap((entityIds) =>
          entityIds.map((entityId) => ({ entityId, entityType: Number(type) })),
        ),
      )
      .flat();

    const titles = await this.getEntityTitles([...entities, ...ancestorEntities]);
    const result: Record<EntityId, { title: string; entityId: EntityId }[]> = {};

    for (const entities of Object.values(ancestors)) {
      const _entities = mapValues(entities, (ids) =>
        ids.map((id) => ({
          title: titles[id]!,
          entityId: id,
        })),
      );

      Object.assign(result, _entities);
    }

    return result;
  }

  async filterAvailable<T extends EntityLocator>(entities: T[]) {
    const entitiesGroup = groupBy(entities, 'type');
    const result: T[] = [];

    for (const [type, _entities] of Object.entries(entitiesGroup)) {
      const ids = map(_entities, 'entityId');
      let availables: { id: string }[];

      switch (Number(type)) {
        case EntityTypes.Note:
          availables = await this.repo.notes.findAll({ id: ids, isAvailable: true });
          break;
        case EntityTypes.Material:
          availables = await this.repo.materials.findAll({ id: ids, isAvailable: true });
          break;
        case EntityTypes.Memo:
          availables = await this.repo.memos.findAll({ id: ids, isAvailable: true });
          break;
        default:
          throw new Error('unsupported type');
      }

      result.push(...intersectionBy(_entities, availables, 'id'));
    }

    return result;
  }

  async getEntityTitles(entities: EntityLocator[]) {
    const titles: Record<EntityId, string> = {};

    const entitiesGroup = groupBy(entities, 'entityType');

    for (const [type, records] of Object.entries(entitiesGroup)) {
      const ids = records.map(({ entityId }) => entityId);

      switch (Number(type)) {
        case EntityTypes.Note:
          Object.assign(titles, await this.noteService.getTitles(ids));
          break;
        case EntityTypes.Material:
          Object.assign(titles, await this.materialService.getTitles(ids));
          break;
        case EntityTypes.Memo:
          Object.assign(titles, await this.memoService.getTitles(ids));
          break;
        default:
          throw new Error('invalid type');
      }
    }

    return titles;
  }
}
