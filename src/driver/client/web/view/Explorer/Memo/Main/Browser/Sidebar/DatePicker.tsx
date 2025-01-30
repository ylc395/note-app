import { DatePicker, parseDate, useDatePicker, type DatePickerValueChangeDetails } from '@ark-ui/solid/date-picker';
import { Index, createEffect, createMemo, on, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import dayjs from 'dayjs';
import { CalendarDaysIcon } from 'lucide-solid';
import { action } from 'mobx';

import { container } from '#domain/shared/infra/singletons';
import TimeSelector from '#domain/client/app/model/memo/TimeSelector';
import uiState from '../../../uiState';

export default function DateRangePicker({ maxDate, minDate }: { minDate: Date; maxDate: Date }) {
  const timeSelector = container.resolve(TimeSelector);
  const datePicker = useDatePicker({
    startOfWeek: 1,
    min: parseDate(minDate),
    max: parseDate(maxDate),
    selectionMode: 'range',
    numOfMonths: 2,
    onValueChange: action(handleValueChange),
  });

  function handleValueChange({ valueAsString }: DatePickerValueChangeDetails) {
    if (valueAsString.length === 2) {
      const [startDate, endDate] = valueAsString;
      timeSelector.selectDay([dayjs(startDate), dayjs(endDate)]);
      uiState.isMenuVisible = 'visible';
    }
  }

  createEffect(
    on(
      () => timeSelector.selectedDuration,
      (value) => !value && datePicker().clearValue(),
    ),
  );

  return (
    <Show when={timeSelector.edgeTime.result.data} keyed>
      <DatePicker.RootProvider value={datePicker} lazyMount unmountOnExit>
        <DatePicker.Control class="flex">
          <DatePicker.Trigger class="flex mt-[5px] items-center text-sm text-gray-400">
            <CalendarDaysIcon class="mr-1" />
            时间段
          </DatePicker.Trigger>
        </DatePicker.Control>
        <Portal mount={document.getElementById(import.meta.env.VITE_WEB_ROOT_ID)!}>
          <DatePicker.Positioner>
            <DatePicker.Content class="z-20 bg-white">
              <DatePicker.YearSelect />
              <DatePicker.MonthSelect />

              <div style={{ display: 'flex', gap: '10px' }}>
                <DatePicker.Context>
                  {(context) => (
                    <DatePicker.Table>
                      <DatePicker.TableHead>
                        <DatePicker.TableRow>
                          <Index each={context().weekDays}>
                            {(weekDay) => <DatePicker.TableHeader>{weekDay().short}</DatePicker.TableHeader>}
                          </Index>
                        </DatePicker.TableRow>
                      </DatePicker.TableHead>

                      <DatePicker.TableBody>
                        <Index each={context().weeks}>
                          {(week) => (
                            <DatePicker.TableRow>
                              <Index each={week()}>
                                {(day) => (
                                  <DatePicker.TableCell value={day()}>
                                    <DatePicker.TableCellTrigger>{day().day}</DatePicker.TableCellTrigger>
                                  </DatePicker.TableCell>
                                )}
                              </Index>
                            </DatePicker.TableRow>
                          )}
                        </Index>
                      </DatePicker.TableBody>
                    </DatePicker.Table>
                  )}
                </DatePicker.Context>

                <DatePicker.Context>
                  {(context) => {
                    const offset = createMemo(() => context().getOffset({ months: 1 }));
                    return (
                      <DatePicker.Table>
                        <DatePicker.TableHead>
                          <DatePicker.TableRow>
                            <Index each={context().weekDays}>
                              {(weekDay) => <DatePicker.TableHeader>{weekDay().short}</DatePicker.TableHeader>}
                            </Index>
                          </DatePicker.TableRow>
                        </DatePicker.TableHead>

                        <DatePicker.TableBody>
                          <Index each={offset().weeks}>
                            {(week) => (
                              <DatePicker.TableRow>
                                <Index each={week()}>
                                  {(day) => (
                                    <DatePicker.TableCell value={day()} visibleRange={offset().visibleRange}>
                                      <DatePicker.TableCellTrigger>{day().day}</DatePicker.TableCellTrigger>
                                    </DatePicker.TableCell>
                                  )}
                                </Index>
                              </DatePicker.TableRow>
                            )}
                          </Index>
                        </DatePicker.TableBody>
                      </DatePicker.Table>
                    );
                  }}
                </DatePicker.Context>
              </div>
            </DatePicker.Content>
          </DatePicker.Positioner>
        </Portal>
      </DatePicker.RootProvider>
    </Show>
  );
}
