import type { ContextmenuItem } from 'infra/UI';
import { useCallback } from 'react';
import { ui } from 'web/infra/ui';

export default function useContextmenu() {
  return useCallback(async () => {
    const items: ContextmenuItem[] = [
      { label: '关闭其他标签', key: 'closeOthers' },
      { label: '关闭右侧所有标签', key: 'closeRight' },
      { label: '关闭左侧所有标签', key: 'closeLeft' },
      { type: 'separator' },
      { label: '向上分屏', key: 'closeOthers' },
      { label: '向下分屏', key: 'closeRight' },
      { label: '向左分屏', key: 'closeLeft' },
      { label: '向右分屏', key: 'closeLeft' },
      { type: 'separator' },
      { label: '在笔记树中定位', key: 'revealOnTree' },
      { label: '复制链接', key: 'copyLink' },
    ];
    const key = await ui.getActionFromContextmenu(items);

    if (!key) {
      return;
    }
  }, []);
}
