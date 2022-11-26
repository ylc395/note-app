import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tabs as TabContainer, TabPane } from '@douyinfe/semi-ui';

import WorkbenchService, { type WindowId } from 'service/WorkbenchService';

export default observer(function Tabs({ id }: { id: WindowId }) {
  const { windowMap } = container.resolve(WorkbenchService);
  const w = windowMap.get(id);

  if (!w) {
    throw new Error(`invalid window id: ${id}`);
  }

  const { switchToTab, closeTab, currentTab } = w;

  return (
    <TabContainer
      type="card"
      collapsible
      className="w-full"
      onChange={switchToTab}
      onTabClose={closeTab}
      activeKey={currentTab?.id}
    >
      {w.tabs.map((tab) => (
        <TabPane tab={tab.material?.name} key={tab.materialId} closable itemKey={tab.id} />
      ))}
    </TabContainer>
  );
});
