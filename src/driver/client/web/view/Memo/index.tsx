import { createEffect, on } from 'solid-js';

import { container } from '#domain/shared/infra/singletons';
import MemoList from '#domain/client/app/model/memo/List';
import UIState, { SidebarTabs } from '#web/view/uiState';

import Sidebar from './Sidebar';
import Main from './Main';

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
    <div class="flex h-screen p-4 w-full">
      <Sidebar />
      <Main />
    </div>
  );
}
