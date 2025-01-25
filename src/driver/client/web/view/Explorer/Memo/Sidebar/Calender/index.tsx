import { RefreshCcwIcon } from 'lucide-solid';
import { Show } from 'solid-js';

import TimeSelector from '#domain/client/app/model/memo/TimeSelector';
import { container } from '#domain/shared/infra/singletons';

import Weeks from './Weeks';
import DatePicker from './DatePicker';

export default function Calendar() {
  const timeSelector = container.resolve(TimeSelector);

  return (
    <div>
      <Weeks />
      <div class="flex space-x-2 text-xs">
        <button class="flex" onclick={timeSelector.refresh.bind(timeSelector)}>
          <RefreshCcwIcon class="mr-1" />
          刷新
        </button>
        <Show when={timeSelector.edgeTime.result.data} keyed>
          <DatePicker
            minDate={new Date(timeSelector.edgeTime.result.data!.first)}
            maxDate={new Date(timeSelector.edgeTime.result.data!.last)}
          />
        </Show>
      </div>
    </div>
  );
}
