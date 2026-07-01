import { Menu } from '@ark-ui/solid';
import assert from 'assert';
import { createMemo, Show } from 'solid-js';
import { EllipsisIcon, EditIcon, HistoryIcon, StarIcon, StarOffIcon, CopyIcon, PinIcon } from 'lucide-solid';
import { action } from 'mobx';

import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';
import { useContext } from './context';

export default function ItemMenu() {
  const memo = createMemo(() => useContext()!.memo);

  async function handleSelect(value: string) {
    switch (value) {
      case 'edit':
        memo().uiState.isEditing = true;
        return;
      case 'copyId':
        return navigator.clipboard.writeText(getAppUrl(RouteTypes.Memo, memo().value.id));
      case 'history':
        memo().uiState.revision = true;
        return;
      case 'pin':
        return memo().togglePin();
      default:
        assert.fail('invalid select value');
    }
  }

  const itemClass = 'flex items-center cursor-pointer';

  return (
    <Menu.Root onSelect={action((e) => handleSelect(e.value))} positioning={{ flip: false }}>
      <Menu.Trigger disabled={Boolean(memo().uiState.isEditing)}>
        <EllipsisIcon size={24} />
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content class="z-10">
          <Menu.Item class={itemClass} value="pin">
            <Show
              when={memo().value.isPinned}
              fallback={
                <>
                  <PinIcon />
                  置顶
                </>
              }
            >
              <PinIcon />
              取消置顶
            </Show>
          </Menu.Item>
          <Menu.Item class={itemClass} value="edit">
            <EditIcon />
            编辑
          </Menu.Item>
          <Menu.Item class={itemClass} value="star">
            <Show
              when={memo().value.isStar}
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
