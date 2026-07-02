import { DatePicker, parseDate, useDatePicker, Tooltip } from '@ark-ui/solid';
import { Index, For, createMemo } from 'solid-js';
import dayjs from 'dayjs';
import { action } from 'mobx';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-solid';
import { useContext } from '../context';

function getColorClass(count: number) {
  if (count === 0) {
    return '';
  }

  if (count <= 5) {
    return 'bg-bg-success text-fg-success';
  }

  if (count <= 10) {
    return 'bg-emerald-200 text-emerald-800';
  }

  if (count <= 20) {
    return 'bg-emerald-300 text-emerald-900';
  }

  return 'bg-emerald-400 text-white';
}

export default function Calendar() {
  const {
    memoList: {
      filter: { timeSelector },
    },
  } = useContext()!;

  const datePicker = useDatePicker({
    startOfWeek: 1,
    open: true,
    closeOnSelect: false,
    numOfMonths: 1,
    onFocusChange: action(({ focusedValue }) => {
      timeSelector.currentMonth = {
        year: focusedValue.year,
        month: focusedValue.month - 1,
      };
    }),
    get min() {
      return timeSelector.availableRange.result.data
        ? parseDate(new Date(timeSelector.availableRange.result.data?.start))
        : undefined;
    },
    get max() {
      if (!timeSelector.now.result.data) {
        return undefined;
      }
      return parseDate(new Date(timeSelector.now.result.data));
    },
  });

  const selectDate = action((date: Date, mode?: 'range' | 'multiple') => {
    timeSelector.selectDay(dayjs(date), mode);
  });

  return (
    <DatePicker.RootProvider value={datePicker}>
      <DatePicker.View view="day">
        <DatePicker.ViewControl class="flex items-center justify-between mb-2">
          <DatePicker.PrevTrigger class="flex items-center justify-center size-7 rounded text-fg-secondary hover:bg-bg-hover transition-colors cursor-pointer">
            <ArrowLeftIcon class="size-4" />
          </DatePicker.PrevTrigger>
          <DatePicker.RangeText class="text-sm font-medium text-fg-primary" />
          <DatePicker.NextTrigger class="flex items-center justify-center size-7 rounded text-fg-secondary hover:bg-bg-hover transition-colors cursor-pointer">
            <ArrowRightIcon class="size-4" />
          </DatePicker.NextTrigger>
        </DatePicker.ViewControl>
        <DatePicker.Table class="border-separate border-spacing-1">
          <DatePicker.TableHead>
            <DatePicker.TableRow>
              <Index each={datePicker().weekDays}>
                {(weekDay) => (
                  <DatePicker.TableHeader class="text-xs text-fg-tertiary font-medium w-8 h-8">
                    {weekDay().short}
                  </DatePicker.TableHeader>
                )}
              </Index>
            </DatePicker.TableRow>
          </DatePicker.TableHead>
          <DatePicker.TableBody>
            <Index each={datePicker().weeks}>
              {(week) => (
                <DatePicker.TableRow>
                  <For each={week()}>
                    {(day) => {
                      const date = dayjs(new Date(day.year, day.month - 1, day.day));
                      const key = date.format('YYYY-MM-DD');
                      const count = createMemo(() => timeSelector.dateCounts.result.data?.[key] ?? 0);

                      return (
                        <DatePicker.TableCell
                          class={`${getColorClass(count())} text-center text-xs rounded-md transition-colors hover:opacity-80 cursor-pointer
                            ${timeSelector.isFuture(date) ? 'text-fg-tertiary' : ''}`}
                          value={day}
                          onClick={(e) =>
                            selectDate(
                              new Date(day.year, day.month - 1, day.day),
                              e.shiftKey ? 'range' : e.metaKey ? 'multiple' : undefined,
                            )
                          }
                        >
                          <Tooltip.Root disabled={count() === 0}>
                            <Tooltip.Trigger>{day.day}</Tooltip.Trigger>
                            <Tooltip.Positioner>
                              <Tooltip.Content class="bg-surface-raised text-fg-primary text-xs rounded-md px-2 py-1 shadow-md border border-border-secondary">
                                {`${day.year}-${day.month + 1}-${day.day}`} {count()}条
                              </Tooltip.Content>
                            </Tooltip.Positioner>
                          </Tooltip.Root>
                        </DatePicker.TableCell>
                      );
                    }}
                  </For>
                </DatePicker.TableRow>
              )}
            </Index>
          </DatePicker.TableBody>
        </DatePicker.Table>
      </DatePicker.View>
    </DatePicker.RootProvider>
  );
}
