import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tabs as AntdTabs } from 'antd';

import WorkbenchService, { type WindowId } from 'service/WorkbenchService';

export default observer(function Tabs({ id }: { id: WindowId }) {
  const { windowMap } = container.resolve(WorkbenchService);
  const w = windowMap.get(id);

  if (!w) {
    throw new Error(`invalid window id: ${id}`);
  }

  const { switchToTab, closeTab, currentTab } = w;

  return (
    <AntdTabs
      type="editable-card"
      className="w-full"
      hideAdd
      onChange={switchToTab}
      onEdit={(key) => typeof key === 'string' && closeTab(key)}
      items={w.tabs.map((tab) => ({ label: tab.editor?.title, key: String(tab.editor?.id) }))}
      activeKey={currentTab?.editor.id}
    />
  );
});
