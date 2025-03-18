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
import { action } from 'mobx';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';

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
        navigator.clipboard.writeText(getAppUrl(RouteTypes.Memo, memoView.value!.id));
        return;
      case 'history':
        memoView.toggleRevisionList();
        return;
      default:
        assert.fail('invalid select value');
    }
  }

  const itemClass = 'flex items-center cursor-pointer';

  return (
    <Menu.Root onSelect={action((e) => handleSelect(e.value))} positioning={{ flip: false }}>
      <Menu.Trigger disabled={Boolean(memoView.selfEditor)}>
        <EllipsisIcon size={24} />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="z-10">
          <Menu.Item class={itemClass} value="edit">
            <EditIcon />
            编辑
          </Menu.Item>
          <Menu.Item class={itemClass} value="pin">
            <Show
              when={memoView.value?.isPinned}
              fallback={
                <>
                  <PinIcon />
                  置顶
                </>
              }
            >
              <PinOffIcon />
              取消置顶
            </Show>
          </Menu.Item>
          <Menu.Item class={itemClass} value="star">
            <Show
              when={memoView.value?.isStar}
              fallback={
                <>
                  <StarIcon />
                  收藏
                </>
              }
            >
              <StarOffIcon />
              取消收藏
            </Show>
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item class={itemClass} value="history">
            <HistoryIcon />
            编辑历史
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
