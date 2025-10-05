import { createEffect, on } from 'solid-js';

import container from '#utils/singletonContainer';
import MemoList from '#domain/client/app/model/memo/List';
import UIState, { SidebarTabs } from '#web/view/UIState';

import Main from './Main';
import SearchBox from './SearchBox';
import Header from '../Header';

export default function MemoExplorer(props: { className: string }) {
  const memoList = container.resolve(MemoList);
  const uiState = container.resolve(UIState);

  createEffect(
    on(
      () => uiState.get('app.explorer') === SidebarTabs.Memo,
      (isActive) => memoList.setActive(isActive),
    ),
  );

  return (
    <div class={props.className}>
      <Header title="Memo" />
      <SearchBox />
      <Main />
    </div>
  );
}
