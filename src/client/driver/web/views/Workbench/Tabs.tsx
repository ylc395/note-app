import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tabs as AntdTabs, ConfigProvider, Button, Tooltip } from 'antd';
import { SplitCellsOutlined } from '@ant-design/icons';

import EditorService from 'service/EditorService';
import type { WindowId } from 'model/windowManager/Manger';

export default observer(function Tabs({ id }: { id: WindowId }) {
  const { windowManager, openEntity } = container.resolve(EditorService);
  const w = windowManager.get(id);
  const { switchToTab, closeTab, currentTab } = w;

  return (
    <ConfigProvider theme={{ components: { Tabs: { margin: 0 } } }}>
      <AntdTabs
        type="editable-card"
        className="w-full bg-gray-100"
        hideAdd
        onChange={switchToTab}
        onEdit={(key) => typeof key === 'string' && closeTab(key)}
        items={w.tabs.map((tab) => ({ label: tab.title, key: tab.id }))}
        activeKey={currentTab?.id}
        tabBarExtraContent={
          w.currentTab && (
            <Tooltip title="开辟新窗口">
              <Button className="mr-2" type="text" icon={<SplitCellsOutlined />} />
            </Tooltip>
          )
        }
      />
    </ConfigProvider>
  );
});
