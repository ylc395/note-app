import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Menu, type MenuProps } from 'antd';
import { FaBoxes } from 'react-icons/fa';
import { SlNotebook } from 'react-icons/sl';

import { KnowledgeTypes } from 'model/constants';
import ViewService from 'service/ViewService';
import { useCallback } from 'react';

export default observer(function ActivityBar() {
  const { currentView, setCurrentView } = container.resolve(ViewService);
  const handleSelect: NonNullable<MenuProps['onSelect']> = useCallback(
    ({ key }) => setCurrentView(key as KnowledgeTypes),
    [setCurrentView],
  );

  return (
    <Menu
      mode="inline"
      inlineCollapsed
      selectedKeys={[currentView]}
      onSelect={handleSelect}
      className="h-screen w-14"
      items={[
        { key: KnowledgeTypes.Materials, icon: <FaBoxes />, label: '素材库' },
        { key: KnowledgeTypes.Notes, icon: <SlNotebook />, label: '笔记本' },
      ]}
    />
  );
});
