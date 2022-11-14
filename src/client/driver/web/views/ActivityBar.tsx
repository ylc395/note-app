import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Nav } from '@douyinfe/semi-ui';
import type { OnSelectedData } from '@douyinfe/semi-ui/lib/es/navigation';
import { IconBox, IconBookStroked } from '@douyinfe/semi-icons';

import { KnowledgeTypes } from 'model/content/constants';
import ViewService from 'service/ViewService';
import { useCallback } from 'react';

export default observer(function ActivityBar() {
  const { currentView, setCurrentView } = container.resolve(ViewService);
  const handleSelect = useCallback(
    ({ itemKey }: OnSelectedData) => setCurrentView(itemKey as KnowledgeTypes),
    [setCurrentView],
  );

  return (
    <Nav
      mode="vertical"
      isCollapsed={true}
      selectedKeys={[currentView]}
      onSelect={handleSelect}
      items={[
        { itemKey: KnowledgeTypes.Materials, text: '资料库', icon: <IconBox /> },
        { itemKey: KnowledgeTypes.Notes, text: '笔记本', icon: <IconBookStroked /> },
      ]}
    />
  );
});
