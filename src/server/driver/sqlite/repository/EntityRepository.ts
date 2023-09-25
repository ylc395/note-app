import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import { type EntityId, EntityTypes, EntityLocator } from 'model/entity';
import type { EntityRepository } from 'service/repository/EntityRepository';

import BaseRepository from './BaseRepository';
import SqliteNoteRepository from './NoteRepository';
import SqliteMaterialRepository from './MaterialRepository';
import SqliteMemoRepository from './MemoRepository';

export default class SqliteEntityRepository extends BaseRepository implements EntityRepository {
  private readonly notes = new SqliteNoteRepository(this.db);
  private readonly materials = new SqliteMaterialRepository(this.db);
  private readonly memos = new SqliteMemoRepository(this.db);

  async findDescendantIds(type: EntityTypes, ids: EntityId[]) {
    let descants: Record<EntityId, EntityId[]> = {};

    switch (type) {
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

    return Object.values(descants).flat();
  }

  async *findAllBody(entities: EntityLocator[]) {
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
        yield { ...row, entityType: Number(type) as EntityTypes };
      }
    }
  }
}
