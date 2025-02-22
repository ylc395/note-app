import { createEffect, on } from 'solid-js';
import { Tabs } from '@ark-ui/solid';

import { container } from '#domain/shared/infra/singletons';
import MemoList from '#domain/client/app/model/memo/List';
import UIState, { SidebarTabs } from '#web/view/UIState';

import Sidebar from './Sidebar';
import Main from './Main';

export default function MemoExplorer(props: { className: string }) {
  const memoList = container.resolve(MemoList);
  const uiState = container.resolve(UIState);

  createEffect(
    on(
      () => uiState.get('app.sidebar') === SidebarTabs.Memo,
      (isActive) => memoList.setActive(isActive),
    ),
  );

  return (
    <Tabs.Content value={SidebarTabs.Memo} class={`flex ${props.className}`}>
      <Sidebar />
      <Main />
    </Tabs.Content>
  );
}
