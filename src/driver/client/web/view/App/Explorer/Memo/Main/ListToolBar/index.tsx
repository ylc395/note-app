import { CalendarDaysIcon, PanelLeftOpenIcon, RefreshCcwIcon, SearchCheckIcon, XCircleIcon } from 'lucide-solid';
import { For, Show } from 'solid-js';
import dayjs from 'dayjs';
import { Tooltip } from '@ark-ui/solid';
import { action } from 'mobx';

import container from '#utils/singletonContainer';
import type { Duration } from '#domain/shared/model/memo';
import MemoList from '#domain/client/app/model/memo/List';

import SortMenu from './SortMenu';

export default function ListToolbar() {
  const memoList = container.resolve(MemoList);
  const {
    filter: { timeSelector },
    childrenQuery,
  } = memoList;

  function getDurationText({ startTime, endTime }: Required<Duration>) {
    const startText = dayjs(startTime).format('YYYY-MM-DD');
    const endText = dayjs(endTime).format('YYYY-MM-DD');

    if (startText === endText) {
      return startText;
    }

    return `${startText} ~ ${endText}`;
  }

  return (
    <div class="mt-4 flex justify-between text-fg-tertiary">
      <div class="flex text-sm items-center">
        <button class="mr-2">
          <PanelLeftOpenIcon />
        </button>
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
            <SearchCheckIcon />
            关键词：{memoList.filter.keyword}
            <button class="ml-1" onClick={action(() => (memoList.filter.keyword = undefined))}>
              <XCircleIcon />
            </button>
          </span>
        </Show>
        <For each={timeSelector.selectedDurations}>
          {(duration, i) => (
            <span class="flex items-center ml-2">
              <CalendarDaysIcon />
              日期：<time class="ml-2">{getDurationText(duration)}</time>
              <button class="ml-1" onclick={() => timeSelector.removeDate(i())}>
                <XCircleIcon />
              </button>
            </span>
          )}
        </For>
      </div>
      <div class="space-x-2 flex text-sm rounded">
        <button onclick={() => childrenQuery.refetch()} class="flex items-center">
          <RefreshCcwIcon />
          刷新
        </button>
        <SortMenu />
      </div>
    </div>
  );
}
