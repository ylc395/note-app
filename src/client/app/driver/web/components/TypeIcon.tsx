import { BookOutlined, DatabaseOutlined, BuildOutlined } from '@ant-design/icons';
import { EntityTypes } from 'model/entity';

const icons = {
  [EntityTypes.Note]: () => <BookOutlined />,
  [EntityTypes.Memo]: () => <BuildOutlined />,
  [EntityTypes.Material]: () => <DatabaseOutlined />,
};

export default function TypeIcon({ type }: { type: EntityTypes.Note | EntityTypes.Material | EntityTypes.Memo }) {
  return icons[type]();
}
