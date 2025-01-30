import type { Dayjs } from 'dayjs';
import { createMemo } from 'solid-js';
import { action } from 'mobx';
import { Tooltip } from '@ark-ui/solid/tooltip';

import { container } from '#domain/shared/infra/singletons';
import uiState from '../../../../uiState';
import MemoService from '#domain/client/app/service/MemoService';

function getColorClass(count: number) {
  if (count === 0) {
    return 'bg-gray-100';
  }

  if (count <= 5) {
    return 'bg-green-100';
  }

  if (count <= 10) {
    return 'bg-green-200';
  }

  if (count <= 20) {
    return 'bg-green-300';
  }

  return 'bg-green-400';
}

export default function Day({ day }: { day: Dayjs }) {
  const { timeSelector } = container.resolve(MemoService);
  const key = day.format('YYYY-MM-DD');

  const count = createMemo(() => timeSelector.recentCounts.result.data?.[key]);
  const isSelected = createMemo(
    () =>
      timeSelector.selectedDuration &&
      day.startOf('d').valueOf() === timeSelector.selectedDuration.startTime &&
      day.endOf('d').valueOf() === timeSelector.selectedDuration.endTime,
  );

  function handleClick() {
    if ((count() ?? 0) === 0) {
      return;
    }
    timeSelector.selectDay(isSelected() ? null : day);
    uiState.tabVisibility = 'visible';
  }

  return (
    <Tooltip.Root openDelay={500} closeDelay={500}>
      <Tooltip.Trigger>
        <div
          class={`h-5 w-5 rounded ${getColorClass(count() ?? 0)} 
            ${(count() ?? 0) > 0 ? 'cursor-pointer' : ''} ${isSelected() ? 'outline' : ''}`}
          onclick={action(handleClick)}
        />
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content class="bg-white">
          {key} 周{day.isoWeekday()} {count() ?? 0}
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}
