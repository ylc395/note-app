import { action } from 'mobx';
import { Show } from 'solid-js';

import TimeSelector from '#domain/client/app/model/memo/TimeSelector';
import { container } from '#domain/shared/infra/singletons';

import Calender from './Calender';
import Tabs from './Tabs';
import uiState from '../uiState';
import DatePicker from './DatePicker';

export default function Sidebar() {
  const timeSelector = container.resolve(TimeSelector);

  return (
    <div
      onClick={action(() => (uiState.isMenuVisible = false))}
      class="z-10 inset-0 absolute lg:bg-transparent lg:static lg:block lg:mr-4"
      classList={{ hidden: !uiState.isMenuVisible }}
    >
      <div
        onclick={(e) => e.stopPropagation()}
        class="w-fit bg-gray-50 h-full border-r flex flex-col shadow-md pt-4 px-4
                lg:border-0 lg:w-auto  lg:shadow-none "
      >
        <div class="flex items-center mb-4 justify-between">
          <h2 class="font-semibold text-lg">MEMOS</h2>
          <Show when={timeSelector.edgeTime.result.data} keyed>
            <DatePicker
              minDate={new Date(timeSelector.edgeTime.result.data!.first)}
              maxDate={new Date(timeSelector.edgeTime.result.data!.last)}
            />
          </Show>
        </div>
        <Calender />
        <Tabs />
      </div>
    </div>
  );
}
