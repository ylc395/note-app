import { container } from 'tsyringe';
import type { DropDownProps, MenuProps } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

import NoteService from 'service/NoteService';
import { SortBy, SortOrder } from 'model/tree/type';
import { computed } from 'mobx';

type MenuItems = NonNullable<DropDownProps['menu']>['items'];

const sortBy = [
  { key: SortBy.Title, label: '根据名称排序' },
  { key: SortBy.UpdatedAt, label: '根据修改时间排序' },
  { key: SortBy.CreatedAt, label: '根据创建时间排序' },
] as const;

const sortOrder = [
  { key: SortOrder.Asc, label: '升序' },
  { key: SortOrder.Desc, label: '降序' },
] as const;

export default function useNoteSort(): {
  handleClick: MenuProps['onClick'];
  menuOptions: { get: () => MenuItems };
} {
  const {
    noteTree: { sortOptions, setSortOptions },
  } = container.resolve(NoteService);
  const menuOptions = computed(
    () =>
      [
        ...sortBy.map(({ key, label }) => ({
          key,
          label,
          icon: <CheckOutlined className={sortOptions.by === key ? '' : 'invisible'} />,
        })),
        { type: 'divider' },
        ...sortOrder.map(({ key, label }) => ({
          key: String(key),
          label,
          icon: <CheckOutlined className={sortOptions.order === key ? '' : 'invisible'} />,
        })),
      ] as MenuItems,
  );

  const handleClick: MenuProps['onClick'] = (e) => setSortOptions(e.key as SortBy | SortOrder);

  return { menuOptions, handleClick };
}
