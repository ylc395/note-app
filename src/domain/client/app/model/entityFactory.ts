import assert from 'assert';

import { EntityId, EntityTypes } from '#domain/shared/model/entity';
import NoteEntity from './note/NoteEntity';

export function entityFactory(type: EntityTypes, id: EntityId, signal: AbortSignal) {
  switch (type) {
    case EntityTypes.Note:
      return new NoteEntity(id, { signal });
    default:
      assert.fail('can not get entity');
  }
}
