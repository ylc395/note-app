import { container } from 'tsyringe';
import { useCallback, useState } from 'react';
import { computed, runInAction } from 'mobx';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { MenuItemGroupType, MenuItemType } from 'antd/es/menu/hooks/useItems';

import StarService from 'service/StarService';
import { EntityTypes } from 'interface/Entity';

export default function useStars() {
  const starService = container.resolve(StarService);
  const [isVisible, setIsVisible] = useState(false);

  const toggle = useCallback(
    (isVisible: boolean) => {
      if (isVisible) {
        starService.loadStars();
        setIsVisible(true);
      } else {
        runInAction(() => (starService.stars = undefined));
        setIsVisible(false);
      }
    },
    [starService],
  );

  const [menu] = useState(() =>
    computed(() => {
      if (!starService.stars) {
        return [];
      }

      if (starService.stars.length === 0) {
        const menu: MenuItemType[] = [{ key: 'noStar', label: '没有任何收藏', disabled: true, className: 'w-80' }];
        return menu;
      }

      const noteStars = starService.stars.filter(({ entityType }) => entityType === EntityTypes.Note);

      const menu: MenuItemGroupType[] = [
        {
          type: 'group',
          label: '笔记',
          className: 'w-80',
          children: noteStars.map(({ title, entityId, id }) => ({
            key: `star-${EntityTypes.Note}-${entityId}`,
            label: (
              <span className="flex items-center justify-between group">
                {title}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    starService.removeStar(id);
                  }}
                  className="group-hover:visible invisible"
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                />{' '}
              </span>
            ),
          })),
        },
      ];

      return menu;
    }),
  );

  return {
    menuKey: 'star',
    menu,
    toggle,
    isVisible,
  };
}
