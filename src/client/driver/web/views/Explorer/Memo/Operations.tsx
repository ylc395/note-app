import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import Button from '@web/components/Button';

// eslint-disable-next-line mobx/missing-observer
export default function Operations() {
  return (
    <div className="flex items-center justify-between">
      <Button>
        <EditOutlined />
      </Button>
      <Button>
        <SettingOutlined />
      </Button>
    </div>
  );
}
