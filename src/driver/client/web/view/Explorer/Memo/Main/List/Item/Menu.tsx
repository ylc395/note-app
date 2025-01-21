import { Menu } from '@ark-ui/solid';
import assert from 'assert';
import { Show } from 'solid-js';
import {
  EllipsisIcon,
  EditIcon,
  PinIcon,
  PinOffIcon,
  HistoryIcon,
  StarIcon,
  StarOffIcon,
  CopyIcon,
} from 'lucide-solid';

import type MemoView from '#domain/client/app/model/memo/MemoView';

export default function ItemMenu({ node }: { node: MemoView }) {
  function handleSelect(value: string) {
    switch (value) {
      case 'pin':
        node.togglePin();
        return;
      case 'edit':
        node.startEditing();
        return;
      default:
        assert.fail('invalid select value');
    }
  }

  const itemClass = 'flex items-center cursor-pointer';

  return (
    <Menu.Root onSelect={(e) => handleSelect(e.value)}>
      <Menu.Trigger disabled={Boolean(node.selfEditor)}>
        <EllipsisIcon size={24} />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="z-10">
          <Menu.Item class={itemClass} value="edit">
            <EditIcon />
            Edit
          </Menu.Item>
          <Menu.Item class={itemClass} value="pin">
            <Show
              when={node.value?.isPinned}
              fallback={
                <>
                  <PinIcon />
                  Pin
                </>
              }
            >
              <PinOffIcon />
              Unpin
            </Show>
          </Menu.Item>
          <Menu.Item class={itemClass} value="star">
            <Show
              when={node.value?.isStar}
              fallback={
                <>
                  <StarIcon /> Star
                </>
              }
            >
              <StarOffIcon />
              UnStar
            </Show>
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item class={itemClass} value="history">
            <HistoryIcon />
            History
          </Menu.Item>
          <Menu.Item class={itemClass} value="copyUrl">
            <CopyIcon />
            复制 ID
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
