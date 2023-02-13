import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { container } from 'tsyringe';
import { Menu, type MenuProps } from 'antd';
import { BuildOutlined, BookOutlined, StarOutlined, StarFilled } from '@ant-design/icons';

import ViewService, { isViewTypes, ViewTypes } from 'service/ViewService';
import useStars from './useStars';

export default observer(function ActivityBar() {
  const { currentView, setCurrentView } = container.resolve(ViewService);
  const handleSelect: NonNullable<MenuProps['onSelect']> = useCallback(
    ({ key }) => isViewTypes(key) && setCurrentView(key),
    [setCurrentView],
  );

  const { menuKey: starMenuKey, toggle: toggleStar, isVisible: isStarVisible, menu: starMenu } = useStars();

  return (
    <Menu
      mode="inline"
      inlineCollapsed
      selectedKeys={[currentView]}
      onSelect={handleSelect}
      className="h-screen w-14 bg-gray-50"
      triggerSubMenuAction="click"
      onOpenChange={(keys) => toggleStar(keys.includes(starMenuKey))}
      items={[
        { key: ViewTypes.Materials, icon: <BuildOutlined />, label: '素材库' },
        { key: ViewTypes.Notes, icon: <BookOutlined />, label: '笔记本' },
        {
          key: starMenuKey,
          icon: isStarVisible ? <StarFilled className="text-yellow-500" /> : <StarOutlined />,
          children: starMenu.get(),
        },
      ]}
    />
  );
});
