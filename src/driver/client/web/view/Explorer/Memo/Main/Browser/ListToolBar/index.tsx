import { RefreshCcwIcon, SearchIcon, XCircleIcon } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';
import dayjs from 'dayjs';
import { Tooltip } from '@ark-ui/solid';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import { container } from '#domain/shared/infra/singletons';
import TimeSelector from '#domain/client/app/model/memo/TimeSelector';

import SortMenu from './SortMenu';
import CollapseButton from './CollapseButton';

export default function ListToolbar({ rootMemo }: { rootMemo: MemoView }) {
  const timeSelector = container.resolve(TimeSelector);
  const durationText = createMemo(() => {
    if (!timeSelector.selectedDuration) {
      return '';
    }

    const startText = dayjs(timeSelector.selectedDuration.startTime).format('YYYY-MM-DD');
    const endText = dayjs(timeSelector.selectedDuration.endTime).format('YYYY-MM-DD');

    if (startText === endText) {
      return startText;
    }

    return `${startText} ~ ${endText}`;
  });

  return (
    <div class="mt-4 flex justify-between text-gray-400">
      <div class="flex text-sm">
        <CollapseButton />
        <Show when={typeof timeSelector.count.result.data === 'number'}>
          <span class="flex items-center">
            <Tooltip.Root openDelay={200} positioning={{ placement: 'top' }}>
              <Tooltip.Trigger>共计 {timeSelector.count.result.data!} 条</Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>不包括 Follow-up</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </span>
        </Show>
        <Show when={timeSelector.selectedDuration}>
          <span class="flex items-center ml-2">
            - <time class="ml-2">{durationText()}</time> 期间
            <button class="ml-1" onclick={() => timeSelector.selectDay(null)}>
              <XCircleIcon />
            </button>
          </span>
        </Show>
      </div>
      <div class="space-x-2 flex text-sm rounded">
        <div class="flex border mr-4 py-1 px-2">
          <input class="outline-none" />
          <SearchIcon />
        </div>
        <button onclick={rootMemo.reload.bind(rootMemo)} class="flex items-center">
          <RefreshCcwIcon />
          刷新
        </button>
        <SortMenu rootMemo={rootMemo} />
      </div>
    </div>
  );
}
