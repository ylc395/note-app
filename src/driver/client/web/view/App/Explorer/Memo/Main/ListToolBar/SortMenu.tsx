import { Menu } from '@ark-ui/solid';
import { SortDescIcon } from 'lucide-solid';

import { useContext } from '../../context';

export default function SortMenu() {
  const {
    memoList: { filter },
  } = useContext()!;

  return (
    <Menu.Root>
      <Menu.Trigger class="flex items-center">
        <SortDescIcon />
        排序
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="z-10 bg-bg-primary">
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
