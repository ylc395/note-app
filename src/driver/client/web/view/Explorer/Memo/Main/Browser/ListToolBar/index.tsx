import { RefreshCcwIcon, SearchIcon, XCircleIcon, ArrowLeftFromLine } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';
import dayjs from 'dayjs';
import { Tooltip } from '@ark-ui/solid';
import { action } from 'mobx';

import { container } from '#domain/shared/infra/singletons';
import MemoService from '#domain/client/app/service/MemoService';

import SortMenu from './SortMenu';
import CollapseButton from './CollapseButton';
import uiState from '../../../uiState';

export default function ListToolbar() {
  const { rootMemo, timeSelector, topicList } = container.resolve(MemoService);
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
      <div class="flex text-sm items-center">
        <CollapseButton />
        <Show when={typeof rootMemo.countQuery!.result.data === 'number'}>
          <span class="flex items-center">
            <Tooltip.Root openDelay={200} positioning={{ placement: 'top' }}>
              <Tooltip.Trigger>共计 {rootMemo.countQuery!.result.data!} 条</Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>不包括 Follow-up</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </span>
        </Show>
        <For each={topicList.selectedTopics}>
          {(topic) => (
            <span class="flex items-center mr-2">
              {topic}
              <button class="ml-1" onClick={() => topicList.unselectTopic(topic)}>
                <XCircleIcon />
              </button>
            </span>
          )}
        </For>
        <Show when={timeSelector.selectedDuration}>
          <span class="flex items-center ml-2">
            <time class="ml-2">{durationText()}</time> 期间
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
        <SortMenu />
        <button class="md:hidden" onclick={action(() => (uiState.selectorVisibility = 'always'))}>
          <ArrowLeftFromLine />
        </button>
      </div>
    </div>
  );
}
