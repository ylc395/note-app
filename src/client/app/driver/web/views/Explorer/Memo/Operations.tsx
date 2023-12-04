import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import IconButton from '@components/IconButton';

// eslint-disable-next-line mobx/missing-observer
export default function Operations() {
  return (
    <div className="flex items-center justify-between">
      <IconButton>
        <EditOutlined />
      </IconButton>
      <IconButton>
        <SettingOutlined />
      </IconButton>
    </div>
  );
}
