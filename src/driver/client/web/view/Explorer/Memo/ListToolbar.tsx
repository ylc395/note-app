import { action } from 'mobx';
import { MenuIcon, SortDescIcon, RefreshCcwIcon } from 'lucide-solid';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import uiState from './uiState';

export default function ListToolbar({ rootMemo }: { rootMemo: MemoView }) {
  return (
    <div class="mt-4 flex justify-between">
      <div class="space-x-2 flex">
        <button class="lg:hidden" onclick={action(() => (uiState.isMenuVisible = true))}>
          <MenuIcon />
        </button>
        <button onclick={rootMemo.reload.bind(rootMemo)}>
          <RefreshCcwIcon />
        </button>
        <button>
          <SortDescIcon />
        </button>
      </div>
      <small>共计100条</small>
    </div>
  );
}
