import { type EntityId, EntityTypes } from 'model/entity';
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
}
