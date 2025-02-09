import { Show } from 'solid-js';
import { action } from 'mobx';

import TimeSelector from '#domain/client/app/model/memo/List/TimeSelector';
import { container } from '#domain/shared/infra/singletons';

import Calender from './Calender';
import DatePicker from './DatePicker';
import TopicList from './TopicList';
import SearchBox from './SearchBox';
import uiState from '../uiState';

export default function Sidebar() {
  const timeSelector = container.resolve(TimeSelector);

  return (
    <div
      onclick={action(() => (uiState.selectorVisibility = 'visible'))}
      class={`${uiState.selectorVisibility === 'always' ? 'flex' : 'hidden'}
        z-10 inset-0 justify-end bg-transparent absolute min-w-0 shrink-0 border-r pr-6 mr-4
        md:static md:z-0 md:flex`}
    >
      <div onclick={(e) => e.stopPropagation()} class="shadow-md bg-gray-50 p-4 md:shadow-none md:p-0">
        <SearchBox />
        <Calender />
        <Show when={timeSelector.edgeTime.result.data} keyed>
          <DatePicker
            minDate={new Date(timeSelector.edgeTime.result.data!.first)}
            maxDate={new Date(timeSelector.edgeTime.result.data!.last)}
          />
        </Show>
        <TopicList />
      </div>
    </div>
  );
}
