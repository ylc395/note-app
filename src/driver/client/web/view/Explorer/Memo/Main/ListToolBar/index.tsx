import { RefreshCcwIcon, SearchIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import dayjs from 'dayjs';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import { container } from '#domain/shared/infra/singletons';
import TimeSelector from '#domain/client/app/model/memo/TimeSelector';

import SortMenu from './SortMenu';

export default function ListToolbar({ rootMemo }: { rootMemo: MemoView }) {
  const timeSelector = container.resolve(TimeSelector);

  return (
    <div class="mt-4 flex justify-between">
      <div>
        <Show when={timeSelector.selectedDuration && timeSelector.count.result.data}>
          共计{timeSelector.count.result.data!.total}条 （
          <time datetime="">{dayjs(timeSelector.selectedDuration!.startTime).format('YYYY-MM-DD')}</time> 期间）
        </Show>
      </div>
      <div class="space-x-2 flex">
        <div class="flex border mr-4">
          <input />
          <SearchIcon />
        </div>
        <button onclick={rootMemo.reload.bind(rootMemo)} class="flex ">
          <RefreshCcwIcon />
          刷新
        </button>
        <SortMenu rootMemo={rootMemo} />
      </div>
    </div>
  );
}
