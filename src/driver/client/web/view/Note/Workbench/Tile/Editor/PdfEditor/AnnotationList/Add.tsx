import { Menu } from '@ark-ui/solid';
import { PlusIcon, RectangleHorizontalIcon, ShapesIcon, ChevronDownIcon } from 'lucide-solid';

export default function Add() {
  const itemClass = 'flex items-center cursor-pointer';

  return (
    <Menu.Root>
      <Menu.Trigger class="flex text-sm">
        <PlusIcon />
        新建
        <ChevronDownIcon />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="bg-white border shadow-md">
          <Menu.Item value="rect" class={itemClass}>
            <RectangleHorizontalIcon class="mr-1" />
            矩形
          </Menu.Item>
          <Menu.Item value="line" class={itemClass}>
            <ShapesIcon class="mr-1" />
            任意图形
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
