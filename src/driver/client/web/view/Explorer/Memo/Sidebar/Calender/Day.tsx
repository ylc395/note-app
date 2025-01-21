import type { Dayjs } from 'dayjs';
import { createMemo } from 'solid-js';
import { action } from 'mobx';

import { container } from '#domain/shared/infra/singletons';
import MemoCalendar from '#domain/client/app/model/memo/Calendar';
import uiState from '../../uiState';

function getColorClass(count: number) {
  if (count === 0) {
    return 'bg-gray-100';
  }

  if (count <= 5) {
    return 'bg-green-50';
  }

  if (count <= 10) {
    return 'bg-green-100';
  }

  if (count <= 20) {
    return 'bg-green-300';
  }

  return 'bg-green-400';
}

export default function Day({ day }: { day: Dayjs }) {
  const calendar = container.resolve(MemoCalendar);
  const key = day.format('YYYY-MM-DD');

  const count = createMemo(() => calendar.data.result.data?.[key] ?? 0);
  const isSelected = createMemo(
    () =>
      calendar.selectedDuration &&
      day.isBetween(calendar.selectedDuration.startTime, calendar.selectedDuration.endTime, null, '[]'),
  );

  return (
    <div
      class={`h-4 w-4 rounded ${getColorClass(count())} 
            ${count() > 0 ? 'cursor-pointer' : ''} ${isSelected() ? 'outline' : ''}`}
      onclick={action(() => {
        if (count() === 0) {
          return;
        }
        calendar.selectDate(isSelected() ? null : day);
        uiState.isMenuVisible = false;
      })}
      title={`${key} ${count()}`}
    />
  );
}
