import { groupBy, map } from 'lodash-es';
import { type EntityId, EntityTypes, type HierarchyEntityLocator } from '@domain/model/entity.js';
import type { ContentEntityTypes, ContentEntityLocator } from '@domain/model/content.js';
import type { EntityRepository } from '@domain/service/repository/EntityRepository.js';

import BaseRepository from './BaseRepository.js';
import SqliteNoteRepository from './NoteRepository.js';
import SqliteMaterialRepository from './MaterialRepository.js';
import SqliteMemoRepository from './MemoRepository.js';
import MaterialAnnotationRepository from './MaterialAnnotationRepository.js';

export default class SqliteEntityRepository extends BaseRepository implements EntityRepository {
  private readonly notes = new SqliteNoteRepository(this.sqliteDb);
  private readonly materials = new SqliteMaterialRepository(this.sqliteDb);
  private readonly annotations = new MaterialAnnotationRepository(this.sqliteDb);
  private readonly memos = new SqliteMemoRepository(this.sqliteDb);

  async findDescendantIds(entities: HierarchyEntityLocator[]) {
    const entitiesGroup = groupBy(entities, 'entityType');
    const result: Record<HierarchyEntityLocator['entityType'], Record<EntityId, EntityId[]>> = {
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

      result[Number(type) as HierarchyEntityLocator['entityType']] = descants;
    }

    return result;
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
