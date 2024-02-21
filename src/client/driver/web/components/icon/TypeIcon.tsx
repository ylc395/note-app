import { AiOutlineBook, AiOutlineDatabase, AiOutlineBuild } from 'react-icons/ai';
import { EntityTypes } from '@domain/app/model/entity';

const icons = {
  [EntityTypes.Note]: () => <AiOutlineBook />,
  [EntityTypes.Memo]: () => <AiOutlineBuild />,
  [EntityTypes.Material]: () => <AiOutlineDatabase />,
};

export default function TypeIcon({ type }: { type: EntityTypes.Note | EntityTypes.Material | EntityTypes.Memo }) {
  return icons[type]();
}
