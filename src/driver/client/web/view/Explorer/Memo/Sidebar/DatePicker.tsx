import { DatePicker } from '@ark-ui/solid/date-picker';
import { Index, createMemo } from 'solid-js';
import { Portal } from 'solid-js/web';

export default function DateRangePicker() {
  return (
    <DatePicker.Root selectionMode="range" numOfMonths={2} class="mt-8">
      <DatePicker.Control class="flex">
        <DatePicker.Input index={0} class="w-20 mr-2 text-sm" />
        <DatePicker.Input index={1} class="w-20 text-sm" />
        <DatePicker.Trigger>📅</DatePicker.Trigger>
        <DatePicker.ClearTrigger>Clear</DatePicker.ClearTrigger>
      </DatePicker.Control>
      <Portal mount={document.getElementById(import.meta.env.VITE_WEB_ROOT_ID)!}>
        <DatePicker.Positioner>
          <DatePicker.Content class="z-20">
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
    </DatePicker.Root>
  );
}
