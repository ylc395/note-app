import { Show } from 'solid-js';

import TimeSelector from '#domain/client/app/model/memo/TimeSelector';
import { container } from '#domain/shared/infra/singletons';

import Calender from './Calender';
import DatePicker from './DatePicker';
import TopicList from './TopicList';

export default function Sidebar() {
  const timeSelector = container.resolve(TimeSelector);

  return (
    <div class="py-4">
      <Calender />
      <Show when={timeSelector.edgeTime.result.data} keyed>
        <DatePicker
          minDate={new Date(timeSelector.edgeTime.result.data!.first)}
          maxDate={new Date(timeSelector.edgeTime.result.data!.last)}
        />
      </Show>
      <TopicList />
    </div>
  );
}
