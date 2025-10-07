import { Menu } from '@ark-ui/solid';
import { SortDescIcon } from 'lucide-solid';

import container from '#utils/singletonContainer';
import MemoList from '#domain/client/app/model/memo/List';

export default function SortMenu() {
  const { filter } = container.resolve(MemoList);

  return (
    <Menu.Root>
      <Menu.Trigger class="flex items-center">
        <SortDescIcon />
        排序
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="z-10 bg-white">
          <Menu.RadioItemGroup
            value={filter.order}
            onValueChange={({ value }) => {
              filter.setOrder(value as 'desc' | 'asc');
            }}
          >
            <Menu.RadioItem class="cursor-pointer" value="createdAt-desc">
              创建时间降序
            </Menu.RadioItem>
            <Menu.RadioItem class="cursor-pointer" value="createdAt-asc">
              创建时间升序
            </Menu.RadioItem>
            <Menu.RadioItem class="cursor-pointer" value="updatedAt-desc">
              更新时间降序
            </Menu.RadioItem>
            <Menu.RadioItem class="cursor-pointer" value="updatedAt-asc">
              更新时间升序
            </Menu.RadioItem>
          </Menu.RadioItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
