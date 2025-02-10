import { RefreshCcwIcon, XCircleIcon } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';
import dayjs from 'dayjs';
import { Tooltip } from '@ark-ui/solid';
import { action } from 'mobx';

import { container } from '#domain/shared/infra/singletons';
import MemoList from '#domain/client/app/model/memo/List';

import SortMenu from './SortMenu';

export default function ListToolbar() {
  const memoList = container.resolve(MemoList);
  const {
    filter: { timeSelector, topicList },
    reload,
  } = memoList;

  const durationText = createMemo(() => {
    return timeSelector.selectedDurations
      .map(({ startTime, endTime }) => {
        const startText = dayjs(startTime).format('YYYY-MM-DD');
        const endText = dayjs(endTime).format('YYYY-MM-DD');

        if (startText === endText) {
          return startText;
        }

        return `${startText} ~ ${endText}`;
      })
      .join(',');
  });

  return (
    <div class="mt-4 flex justify-between text-gray-400">
      <div class="flex text-sm items-center">
        <Show when={typeof memoList.count === 'number'}>
          <span class="flex items-center">
            <Tooltip.Root openDelay={200} positioning={{ placement: 'top' }}>
              <Tooltip.Trigger>共计 {memoList.count!} 条</Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>不包括 Follow-up</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </span>
        </Show>
        <Show when={memoList.filter.keyword}>
          <span class="flex items-center">
            关键词{memoList.filter.keyword}
            <button class="ml-1" onClick={action(() => (memoList.filter.keyword = undefined))}>
              <XCircleIcon />
            </button>
          </span>
        </Show>
        <For each={topicList.selectedTopics}>{(topic) => <span class="flex items-center mr-2">{topic}</span>}</For>
        <Show when={timeSelector.selectedDurations.length > 0}>
          <span class="flex items-center ml-2">
            <time class="ml-2">{durationText()}</time> 期间
            <button class="ml-1" onclick={() => timeSelector.selectDay(null)}>
              <XCircleIcon />
            </button>
          </span>
        </Show>
      </div>
      <div class="space-x-2 flex text-sm rounded">
        <button onclick={reload.bind(memoList)} class="flex items-center">
          <RefreshCcwIcon />
          刷新
        </button>
        <SortMenu />
      </div>
    </div>
  );
}
