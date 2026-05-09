import assert from 'assert';

import { EntityId, EntityTypes } from '#domain/shared/model/entity';
import NoteSource from './note/Source';

export default function entitySourceFactory(type: EntityTypes, id: EntityId, signal: AbortSignal) {
  switch (type) {
    case EntityTypes.Note:
      return new NoteSource(id, { signal });
    default:
      assert.fail('can not get entitySource');
  }
}
