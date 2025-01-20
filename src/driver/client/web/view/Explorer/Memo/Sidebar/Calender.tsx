import { range } from 'lodash-es';
import { createMemo, For, Show } from 'solid-js';
import MemoCalendar from '#domain/client/app/model/memo/Calendar';
import { container } from '#domain/shared/infra/singletons';

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

export default function Calendar() {
  const { duration, data, isFuture, selectDate } = container.resolve(MemoCalendar);
  const diffWeeks = duration.endTime.diff(duration.startTime, 'week');
  const weeks = range(0, diffWeeks + 1);

  return (
    <div class="flex space-x-1">
      <For each={weeks}>
        {(w, index) => {
          const weekStart = duration.startTime.add(w, 'week').startOf('isoWeek');
          const lastWeekStart = w > 0 ? duration.startTime.add(w - 1, 'week') : weekStart;

          return (
            <div>
              <div class="flex flex-col space-y-1">
                <For each={range(0, 7)}>
                  {(d) => {
                    const day = weekStart.add(d, 'day');
                    const key = day.format('YYYY-MM-DD');
                    const count = createMemo(() => data.result.data?.[key] ?? 0);

                    return (
                      <Show when={index() !== weeks.length - 1 || !isFuture(day)}>
                        <div
                          class={`h-4 w-4 rounded ${getColorClass(count())} ${count() > 0 ? 'cursor-pointer' : ''}`}
                          onclick={() => selectDate(day)}
                          title={`${key} ${count()}`}
                        />
                      </Show>
                    );
                  }}
                </For>
              </div>
              <Show when={weekStart.month() !== lastWeekStart.month()}>
                <span class="absolute text-xs">{weekStart.month() + 1}月</span>
              </Show>
            </div>
          );
        }}
      </For>
    </div>
  );
}
