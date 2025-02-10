import { DatePicker, parseDate, useDatePicker } from '@ark-ui/solid/date-picker';
import { Index, For } from 'solid-js';
import dayjs from 'dayjs';
import { action } from 'mobx';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-solid';

import { container } from '#domain/shared/infra/singletons';
import uiState from '../uiState';
import MemoList from '#domain/client/app/model/memo/List';

function getColorClass(count: number) {
  if (count === 0) {
    return '';
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

export default function Calendar() {
  const {
    filter: { timeSelector },
  } = container.resolve(MemoList);

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
      return timeSelector.availableRange.result.data
        ? parseDate(new Date(timeSelector.availableRange.result.data?.end))
        : undefined;
    },
  });

  const selectDate = action((date: Date, mode?: 'range' | 'multiple') => {
    timeSelector.selectDay(dayjs(date), mode);
    uiState.tabVisibility = 'visible';
  });

  return (
    <DatePicker.RootProvider value={datePicker}>
      <DatePicker.View view="day">
        <DatePicker.ViewControl class="flex items-center justify-between">
          <DatePicker.PrevTrigger>
            <ArrowLeftIcon />
          </DatePicker.PrevTrigger>
          {/* <DatePicker.ViewTrigger> */}
          <DatePicker.RangeText />
          {/* </DatePicker.ViewTrigger> */}
          <DatePicker.NextTrigger>
            <ArrowRightIcon />
          </DatePicker.NextTrigger>
        </DatePicker.ViewControl>
        <DatePicker.Table>
          <DatePicker.TableHead>
            <DatePicker.TableRow>
              <Index each={datePicker().weekDays}>
                {(weekDay) => <DatePicker.TableHeader>{weekDay().short}</DatePicker.TableHeader>}
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

                      return (
                        <DatePicker.TableCell
                          class={`${getColorClass(timeSelector.dateCounts.result.data?.[key] ?? 0)} text-center 
                                  ${timeSelector.isFuture(date) ? 'text-gray-300' : ''}`}
                          value={day}
                          onClick={(e) =>
                            selectDate(
                              new Date(day.year, day.month - 1, day.day),
                              e.shiftKey ? 'range' : e.metaKey ? 'multiple' : undefined,
                            )
                          }
                        >
                          {day.day}
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
