import { BookIcon, DatabaseIcon, BlocksIcon } from 'lucide-react';
import { EntityTypes } from '@domain/app/model/entity';

const icons = {
  [EntityTypes.Note]: () => <BookIcon />,
  [EntityTypes.Memo]: () => <BlocksIcon />,
  [EntityTypes.Material]: () => <DatabaseIcon />,
};

export default function TypeIcon({ type }: { type: EntityTypes.Note | EntityTypes.Material | EntityTypes.Memo }) {
  return icons[type]();
}
