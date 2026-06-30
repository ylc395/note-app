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
                      const count = createMemo(() => timeSelector.dateCounts.result.data?.[key] ?? 0);

                      return (
                        <DatePicker.TableCell
                          class={`${getColorClass(count())} text-center 
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
                              <Tooltip.Content>
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
