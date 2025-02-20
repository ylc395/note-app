import { createEffect, on } from 'solid-js';
import { Tabs } from '@ark-ui/solid';

import { container } from '#domain/shared/infra/singletons';
import MemoList from '#domain/client/app/model/memo/List';
import UIState, { SidebarTabs } from '#web/view/UIState';

import Sidebar from './Sidebar';
import Main from './Main';
import { mainTab } from '../classNames';

export default function MemoExplorer() {
  const { filter } = container.resolve(MemoList);
  const uiState = container.resolve(UIState);

  createEffect(
    on(
      () => uiState.value?.['app.sidebar'] === SidebarTabs.Memo,
      (isActive) => filter.setActive(isActive),
    ),
  );

  return (
    <Tabs.Content value={SidebarTabs.Memo} class={`flex ${mainTab}`}>
      <Sidebar />
      <Main />
    </Tabs.Content>
  );
}
