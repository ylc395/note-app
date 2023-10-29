import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

interface Props {
  toggle: () => void;
  isExpanded: boolean;
}

// eslint-disable-next-line mobx/missing-observer
export default function Operations({ toggle, isExpanded }: Props) {
  return (
    <div className="mt-2 flex items-center justify-between">
      <div>
        <Tooltip title={isExpanded ? '收起' : '展开'}>
          <Button type="text" icon={<EditOutlined />} onClick={toggle} />
        </Tooltip>
      </div>
      <Tooltip title="视图配置">
        <Button type="text" icon={<SettingOutlined />} />
      </Tooltip>
    </div>
  );
}
