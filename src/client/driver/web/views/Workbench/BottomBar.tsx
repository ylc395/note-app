import { observer } from 'mobx-react-lite';
import { Button, Tooltip } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, SettingOutlined } from '@ant-design/icons';

export default observer(function BottomBar() {
  return (
    <div className="flex items-center justify-between overflow-hidden bg-gray-50 px-2 py-3">
      <div>
        <Tooltip title="后退">
          <Button type="text" size="small" icon={<ArrowLeftOutlined />} />
        </Tooltip>
        <Tooltip title="前进">
          <Button type="text" size="small" icon={<ArrowRightOutlined />} />
        </Tooltip>
      </div>
      <div className="text-sm text-gray-500">暂未配置任何同步机制</div>
      <div className="select-text space-x-3">
        <Tooltip title="配置工作台">
          <Button type="text" size="small" icon={<SettingOutlined />} />
        </Tooltip>
      </div>
    </div>
  );
});
