import { CalendarDaysIcon, RefreshCcwIcon, ShuffleIcon, XCircleIcon } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';
import dayjs from 'dayjs';
import { Tooltip } from '@ark-ui/solid';

import type { Duration } from '#domain/shared/model/memo';

import Button from '#web/view/components/Button';
import SortOption from './SortOption';
import { useContext } from '../context';

export default function ListToolbar() {
  const memoList = createMemo(() => useContext()!.memoList);

  function getDurationText({ startTime, endTime }: Required<Duration>) {
    const startText = dayjs(startTime).format('YYYY-MM-DD');
    const endText = dayjs(endTime).format('YYYY-MM-DD');

    if (startText === endText) {
      return startText;
    }

    return `${startText} ~ ${endText}`;
  }

  return (
    <div class="mt-4 flex flex-wrap items-center justify-between gap-2 text-fg-secondary">
      <div class="flex flex-wrap items-center gap-1.5 text-xs">
        <Show when={typeof memoList().count === 'number'}>
          <span class="flex items-center text-fg-tertiary">
            <Tooltip.Root openDelay={200} positioning={{ placement: 'top' }}>
              <Tooltip.Trigger>共计 {memoList().count} 条</Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content class="bg-surface-raised text-fg-primary text-xs rounded-md px-2 py-1 shadow-md border border-border-secondary">
                  不包括 Follow-up
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </span>
        </Show>
        <For each={memoList().filter.timeSelector.selectedDurations}>
          {(duration, i) => (
            <span class="inline-flex items-center gap-1 rounded-full bg-bg-tertiary pl-2 pr-1 py-0.5 text-fg-secondary">
              <CalendarDaysIcon class="size-3.5 text-fg-tertiary" />
              <time>{getDurationText(duration)}</time>
              <button
                class="flex items-center text-fg-tertiary hover:text-fg-danger transition-colors"
                onclick={() => memoList().filter.timeSelector.removeDate(i())}
              >
                <XCircleIcon class="size-3.5" />
              </button>
            </span>
          )}
        </For>
      </div>
      <div class="flex items-center gap-1">
        <Show
          when={memoList().filter.order === 'random'}
          fallback={
            <Button size="small" onClick={() => memoList().childrenQuery.refetch()}>
              <RefreshCcwIcon />
              刷新
            </Button>
          }
        >
          <Button size="small" onClick={() => memoList().filter.shuffle()}>
            <ShuffleIcon />
            换一批
          </Button>
        </Show>
        <SortOption />
      </div>
    </div>
  );
}
