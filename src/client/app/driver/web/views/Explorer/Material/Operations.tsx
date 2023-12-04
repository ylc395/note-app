import { container } from 'tsyringe';
import { SettingOutlined, FolderAddOutlined, ShrinkOutlined } from '@ant-design/icons';
import MaterialService from '@domain/service/MaterialService';
import IconButton from '@components/IconButton';

// eslint-disable-next-line mobx/missing-observer
export default function Operations() {
  const { createDirectory } = container.resolve(MaterialService);

  return (
    <div className="flex justify-between">
      <IconButton onClick={createDirectory}>
        <FolderAddOutlined />
      </IconButton>
      <IconButton>
        <ShrinkOutlined />
      </IconButton>
      <IconButton>
        <SettingOutlined />
      </IconButton>
    </div>
  );
}
