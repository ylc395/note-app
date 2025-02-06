import { last, range } from 'lodash-es';
import { For, Show } from 'solid-js';

import { container } from '#domain/shared/infra/singletons';
import Day from './Day';
import MemoService from '#domain/client/app/service/MemoService';

export default function Weeks() {
  const { timeSelector } = container.resolve(MemoService);
  const diffWeeks = timeSelector.recent.endTime.diff(timeSelector.recent.startTime, 'week');
  const weeks = range(0, diffWeeks + 1).map((weekOffset) => {
    const weekStart = timeSelector.recent.startTime.add(weekOffset, 'week').startOf('isoWeek');
    return range(0, 7).map((dayOffset) => weekStart.add(dayOffset, 'day'));
  });

  return (
    <div class="flex space-x-1 mb-4">
      <For each={weeks}>
        {(week, index) => {
          const newMonth = week.some(
            (day, i) =>
              !timeSelector.isFuture(day) && day.month() !== (week[i - 1] ?? last(weeks[index() - 1]) ?? day)!.month(),
          )
            ? last(week)!.month()
            : undefined;

          return (
            <div>
              <div class="flex flex-col space-y-1">
                <For each={week}>{(day) => <Day day={day} />}</For>
              </div>
              <Show when={typeof newMonth === 'number'}>
                <span class="absolute text-sm text-gray-400">{newMonth! + 1}月</span>
              </Show>
            </div>
          );
        }}
      </For>
    </div>
  );
}
