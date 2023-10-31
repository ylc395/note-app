import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import { type EntityId, EntityTypes, HierarchyEntityTypes, HierarchyEntityLocator } from 'model/entity';
import type { ContentEntityTypes, ContentEntityLocator } from 'model/content';
import type { EntityRepository } from 'service/repository/EntityRepository';

import BaseRepository from './BaseRepository';
import SqliteNoteRepository from './NoteRepository';
import SqliteMaterialRepository from './MaterialRepository';
import SqliteMemoRepository from './MemoRepository';
import MaterialAnnotationRepository from './MaterialAnnotationRepository';

export default class SqliteEntityRepository extends BaseRepository implements EntityRepository {
  private readonly notes = new SqliteNoteRepository(this.sqliteDb);
  private readonly materials = new SqliteMaterialRepository(this.sqliteDb);
  private readonly annotations = new MaterialAnnotationRepository(this.sqliteDb);
  private readonly memos = new SqliteMemoRepository(this.sqliteDb);

  async findDescendantIds(entities: HierarchyEntityLocator[]) {
    const entitiesGroup = groupBy(entities, 'entityType');
    const result: Record<HierarchyEntityTypes, Record<EntityId, EntityId[]>> = {
      [EntityTypes.Note]: {},
      [EntityTypes.Memo]: {},
      [EntityTypes.Material]: {},
    };

    for (const [type, _entities] of Object.entries(entitiesGroup)) {
      let descants: Record<EntityId, EntityId[]> = {};
      const ids = map(_entities, 'entityId');

      switch (Number(type)) {
        case EntityTypes.Note:
          descants = await this.notes.findDescendantIds(ids);
          break;
        case EntityTypes.Material:
          descants = await this.materials.findDescendantIds(ids);
          break;
        case EntityTypes.Memo:
          descants = await this.memos.findDescendantIds(ids);
          break;
        default:
          break;
      }

      result[Number(type) as HierarchyEntityTypes] = descants;
    }

    return result;
  }

  async findBody({ entityId, entityType }: ContentEntityLocator) {
    switch (entityType) {
      case EntityTypes.Note:
        return await this.notes.findBody(entityId);
      case EntityTypes.Memo:
        return (await this.memos.findOneById(entityId))?.content ?? null;
      case EntityTypes.Material:
        return (await this.materials.findOneById(entityId))?.comment ?? null;
      case EntityTypes.MaterialAnnotation:
        return (await this.materials.findAnnotationById(entityId))?.comment ?? null;
      default:
        throw new Error('unsupported type');
    }
  }

  async *findAllBody(entities: ContentEntityLocator[]) {
    const entitiesGroup = groupBy(entities, 'entityType');

    for (const [type, _entities] of Object.entries(entitiesGroup)) {
      const ids = map(_entities, 'entityId');
      let stream: AsyncIterableIterator<{ entityId: EntityId; content: string }>;

      switch (Number(type)) {
        case EntityTypes.Note:
          stream = this.db
            .selectFrom(this.notes.tableName)
            .select(['id as entityId', 'body as content'])
            .where('id', 'in', ids)
            .stream();
          break;
        case EntityTypes.Material:
          stream = this.db
            .selectFrom(this.materials.tableName)
            .select(['id as entityId', 'comment as content'])
            .where('id', 'in', ids)
            .stream();
          break;
        case EntityTypes.MaterialAnnotation:
          stream = this.db
            .selectFrom(this.annotations.tableName)
            .select(['id as entityId', 'comment as content'])
            .where('id', 'in', ids)
            .stream();
          break;
        case EntityTypes.Memo:
          stream = this.db
            .selectFrom(this.memos.tableName)
            .select(['id as entityId', 'content'])
            .where('id', 'in', ids)
            .stream();
          break;
        default:
          throw new Error('unsupported type');
      }

      for await (const row of stream) {
        yield { ...row, entityType: Number(type) as ContentEntityTypes };
      }
    }
  }
}
