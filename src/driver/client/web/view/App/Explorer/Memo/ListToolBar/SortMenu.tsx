import { Menu } from '@ark-ui/solid';
import { SortDescIcon } from 'lucide-solid';

import Button from '#web/view/components/Button';
import { useContext } from '../context';

export default function SortMenu() {
  const {
    memoList: { filter },
  } = useContext()!;

  return (
    <Menu.Root>
      <Menu.Trigger asChild={(childProps) => (
        <Button {...childProps()} size="small">
          <SortDescIcon />
          排序
        </Button>
      )} />
      <Menu.Positioner>
        <Menu.Content class="z-10 min-w-[10rem] bg-surface-raised border border-border-primary rounded-lg shadow-lg p-1">
          <Menu.RadioItemGroup
            value={filter.order}
            onValueChange={({ value }) => {
              filter.setOrder(value as 'desc' | 'asc');
            }}
          >
            <Menu.RadioItem
              class="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-fg-primary hover:bg-bg-hover cursor-pointer data-[checked]:bg-bg-accent-subtle data-[checked]:text-fg-accent-subtle transition-colors"
              value="createdAt-desc"
            >
              创建时间降序
            </Menu.RadioItem>
            <Menu.RadioItem
              class="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-fg-primary hover:bg-bg-hover cursor-pointer data-[checked]:bg-bg-accent-subtle data-[checked]:text-fg-accent-subtle transition-colors"
              value="createdAt-asc"
            >
              创建时间升序
            </Menu.RadioItem>
            <Menu.RadioItem
              class="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-fg-primary hover:bg-bg-hover cursor-pointer data-[checked]:bg-bg-accent-subtle data-[checked]:text-fg-accent-subtle transition-colors"
              value="updatedAt-desc"
            >
              更新时间降序
            </Menu.RadioItem>
            <Menu.RadioItem
              class="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-fg-primary hover:bg-bg-hover cursor-pointer data-[checked]:bg-bg-accent-subtle data-[checked]:text-fg-accent-subtle transition-colors"
              value="updatedAt-asc"
            >
              更新时间升序
            </Menu.RadioItem>
          </Menu.RadioItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
