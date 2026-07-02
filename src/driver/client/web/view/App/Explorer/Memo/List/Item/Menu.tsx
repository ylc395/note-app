import { Menu } from '@ark-ui/solid';
import assert from 'assert';
import { createMemo, Show } from 'solid-js';
import { EllipsisIcon, EditIcon, HistoryIcon, StarIcon, StarOffIcon, CopyIcon, PinIcon } from 'lucide-solid';
import { action } from 'mobx';

import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';
import Button from '#web/view/components/Button';
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

  const itemClass =
    'flex items-center gap-2 px-3 py-1.5 rounded text-sm text-fg-primary hover:bg-bg-hover cursor-pointer transition-colors';

  return (
    <Menu.Root onSelect={action((e) => handleSelect(e.value))} positioning={{ flip: false }}>
      <Menu.Trigger asChild={(childProps) => (
        <Button {...childProps()} square size="small" disabled={Boolean(memo().uiState.isEditing)}>
          <EllipsisIcon />
        </Button>
      )} />
      <Menu.Positioner>
        <Menu.Content class="z-10 min-w-[10rem] bg-surface-raised border border-border-primary rounded-lg shadow-lg p-1">
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
          <Menu.Separator class="h-px bg-border-secondary my-1" />
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
