import assert from 'assert';
import { Show } from 'solid-js';
import dayjs from 'dayjs';

import type MemoView from '#domain/client/app/model/memo/MemoView';

export default function Item({ value }: { value: MemoView }) {
  assert(value.value, 'no memo value');
  const date = dayjs(value.value.createdAt);

  return (
    <div class="shadow-md rounded-lg max-w-3xl mx-auto border">
      <div>
        <Show when={value.value.isPinned}>
          <span>Pinned</span>
        </Show>
        <time datetime={date.toISOString()}>{date.format('YYYY-MM-DD HH:mm:ss')}</time>
      </div>
      <div class="min-h-36 select-text">{value.value.body}</div>
    </div>
  );
}
