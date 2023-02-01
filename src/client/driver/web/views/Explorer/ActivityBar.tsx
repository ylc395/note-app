import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { container } from 'tsyringe';
import { Menu, type MenuProps } from 'antd';
import { BuildOutlined, BookOutlined } from '@ant-design/icons';

import ViewService, { ViewTypes } from 'service/ViewService';

export default observer(function ActivityBar() {
  const { currentView, setCurrentView } = container.resolve(ViewService);
  const handleSelect: NonNullable<MenuProps['onSelect']> = useCallback(
    ({ key }) => setCurrentView(key as ViewTypes),
    [setCurrentView],
  );

  return (
    <Menu
      mode="inline"
      inlineCollapsed
      selectedKeys={[currentView]}
      onSelect={handleSelect}
      className="h-screen w-14 bg-gray-50"
      items={[
        { key: ViewTypes.Materials, icon: <BuildOutlined />, label: '素材库' },
        { key: ViewTypes.Notes, icon: <BookOutlined />, label: '笔记本' },
      ]}
    />
  );
});
