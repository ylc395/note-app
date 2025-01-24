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
import { getAppUrl } from '#domain/shared/infra/markdown/url';

export default function ItemMenu({ memoView }: { memoView: MemoView }) {
  function handleSelect(value: string) {
    switch (value) {
      case 'pin':
        memoView.togglePin();
        return;
      case 'edit':
        memoView.startEditing();
        return;
      case 'copyId':
        navigator.clipboard.writeText(getAppUrl(memoView.value!.id, 'memos'));
        return;
      default:
        assert.fail('invalid select value');
    }
  }

  const itemClass = 'flex items-center cursor-pointer';

  return (
    <Menu.Root onSelect={(e) => handleSelect(e.value)}>
      <Menu.Trigger disabled={Boolean(memoView.selfEditor)}>
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
              when={memoView.value?.isPinned}
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
              when={memoView.value?.isStar}
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
          <Menu.Item class={itemClass} value="copyId">
            <CopyIcon />
            复制 URL
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
