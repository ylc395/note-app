import { action } from 'mobx';
import { MenuIcon, SortDescIcon, RefreshCcwIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import { container } from '#domain/shared/infra/singletons';
import Calendar from '#domain/client/app/model/memo/Calendar';

import uiState from './uiState';

export default function ListToolbar({ rootMemo }: { rootMemo: MemoView }) {
  const calender = container.resolve(Calendar);

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
      <div>
        <Show when={calender.selectedDate}>
          <time datetime="">{calender.selectedDate!.format('YYYY-MM-DD')}</time>
        </Show>
        <small>共计100条</small>
      </div>
    </div>
  );
}
