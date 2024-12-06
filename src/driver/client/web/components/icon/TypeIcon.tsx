import assert from 'assert';
import { BookIcon, DatabaseIcon, BlocksIcon } from 'lucide-react';
import { EntityTypes } from '#domain/client/shared/model/entity';

export default function TypeIcon({ type }: { type: EntityTypes }) {
  switch (type) {
    case EntityTypes.Note:
      return <BookIcon />;
    case EntityTypes.Memo:
      return <BlocksIcon />;
    case EntityTypes.Material:
      return <DatabaseIcon />;
    default:
      assert.fail('invalid type');
  }
}
