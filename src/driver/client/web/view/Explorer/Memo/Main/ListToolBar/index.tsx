import { RefreshCcwIcon, SearchIcon, XIcon, InfoIcon } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';
import dayjs from 'dayjs';
import { Tooltip } from '@ark-ui/solid';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import { container } from '#domain/shared/infra/singletons';
import TimeSelector from '#domain/client/app/model/memo/TimeSelector';

import SortMenu from './SortMenu';

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
    <div class="mt-4 flex justify-between">
      <div>
        <Show when={typeof timeSelector.count.result.data === 'number'}>
          共计{timeSelector.count.result.data!}条
          <Tooltip.Root openDelay={200} positioning={{ placement: 'top' }}>
            <Tooltip.Trigger>
              <InfoIcon />
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content>不包括 Follow-up</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        </Show>
        <Show when={timeSelector.selectedDuration}>
          （<time datetime="">{durationText()}</time> 期间
          <button onclick={() => timeSelector.selectDay(null)}>
            <XIcon />
          </button>
          ）
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
