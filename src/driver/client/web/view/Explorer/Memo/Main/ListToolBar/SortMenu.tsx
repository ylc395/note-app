import type MemoView from '#domain/client/app/model/memo/MemoView';
import { Menu } from '@ark-ui/solid';
import { SortDescIcon } from 'lucide-solid';

export default function SortMenu({ rootMemo }: { rootMemo: MemoView }) {
  return (
    <Menu.Root>
      <Menu.Trigger class="flex">
        <SortDescIcon />
        排序
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="z-10 bg-white">
          <Menu.RadioItemGroup
            value={`${rootMemo.sortOptions.orderBy}-${rootMemo.sortOptions.order}`}
            onValueChange={({ value }) => {
              const [orderBy, order] = value.split('-') as ['createdAt' | 'updatedAt', 'desc' | 'asc'];
              rootMemo.setOrder({ order, orderBy });
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
