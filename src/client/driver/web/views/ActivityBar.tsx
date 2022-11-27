import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Nav } from '@douyinfe/semi-ui';
import type { OnSelectedData } from '@douyinfe/semi-ui/lib/es/navigation';
import { FaBoxes } from 'react-icons/fa';
import { SlNotebook } from 'react-icons/sl';

import { KnowledgeTypes } from 'model/constants';
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
      className="h-screen"
      items={[
        { itemKey: KnowledgeTypes.Materials, text: '资料库', icon: <FaBoxes /> },
        { itemKey: KnowledgeTypes.Notes, text: '笔记本', icon: <SlNotebook /> },
      ]}
    />
  );
});
