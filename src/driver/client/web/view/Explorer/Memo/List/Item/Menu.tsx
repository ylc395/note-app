import { Menu } from '@ark-ui/solid';
import assert from 'assert';
import { Show } from 'solid-js';
import { AiOutlineEllipsis, AiOutlineEdit, AiOutlinePushpin, AiOutlineStar, AiFillStar } from 'solid-icons/ai';

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

  return (
    <Menu.Root onSelect={(e) => handleSelect(e.value)}>
      <Menu.Trigger disabled={Boolean(node.selfEditor)}>
        <AiOutlineEllipsis size={24} />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item class="flex items-center cursor-pointer" value="edit">
            <AiOutlineEdit />
            Edit
          </Menu.Item>
          <Menu.Item class="flex items-center cursor-pointer" value="pin">
            <AiOutlinePushpin />
            {node.value?.isPinned ? 'Unpin' : 'Pin'}
          </Menu.Item>
          <Show
            when={node.value?.isStar}
            fallback={
              <Menu.Item class="flex items-center cursor-pointer" value="star">
                <AiOutlineStar />
                Star
              </Menu.Item>
            }
          >
            <Menu.Item class="flex items-center cursor-pointer" value="star">
              <AiFillStar />
              UnStar
            </Menu.Item>
          </Show>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
