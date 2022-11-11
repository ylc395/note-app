import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Nav } from '@douyinfe/semi-ui';
import { IconBox, IconBookStroked } from '@douyinfe/semi-icons';

import { KnowledgeTypes } from 'model/content/constants';
import ViewService from 'service/ViewService';

export default observer(function ActivityBar() {
  const { currentView, setCurrentView } = container.resolve(ViewService);

  return (
    <Nav
      mode="vertical"
      isCollapsed={true}
      selectedKeys={[currentView]}
      onSelect={({ itemKey }) => setCurrentView(itemKey as KnowledgeTypes)}
      items={[
        { itemKey: KnowledgeTypes.Materials, text: '资料库', icon: <IconBox /> },
        { itemKey: KnowledgeTypes.Notes, text: '笔记本', icon: <IconBookStroked /> },
      ]}
    />
  );
});
