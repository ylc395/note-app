import assert from 'assert';
import { Show } from 'solid-js';
import dayjs from 'dayjs';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import Menu from './Menu';

export default function Item({ value }: { value: MemoView }) {
  assert(value.value, 'no memo value');
  const date = dayjs(value.value.createdAt);

  return (
    <div class="shadow-md rounded-lg max-w-3xl mx-auto border p-4" attr:data-memo-id={value.id}>
      <div class="flex justify-between items-center">
        <div>
          <Show when={value.value.isPinned}>
            <span>Pinned</span>
          </Show>
          <time datetime={date.toISOString()} class="text-gray-400">
            {date.format('YYYY-MM-DD HH:mm:ss')}
          </time>
        </div>
        <Menu node={value} />
      </div>
      <div class="select-text mt-2">{value.value.body}</div>
    </div>
  );
}
