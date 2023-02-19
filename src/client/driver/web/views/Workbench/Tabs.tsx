import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tabs as AntdTabs, ConfigProvider, Button, Tooltip } from 'antd';
import { SplitCellsOutlined } from '@ant-design/icons';

import WorkbenchService, { type WindowId } from 'service/WorkbenchService';
import { EntityTypes } from 'interface/Entity';

export default observer(function Tabs({ id }: { id: WindowId }) {
  const { windowManager, openEntity } = container.resolve(WorkbenchService);
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
        items={w.tabs.map((tab) => ({ label: tab.editor?.title, key: String(tab.editor?.id) }))}
        activeKey={currentTab?.editor.id}
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
