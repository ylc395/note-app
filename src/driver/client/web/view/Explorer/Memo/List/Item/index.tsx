import assert from 'assert';
import { Show } from 'solid-js';
import dayjs from 'dayjs';
import { LinkIcon, MessageCircleIcon } from 'lucide-solid';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import Menu from './Menu';
import Body from './Body';

export default function Item({ node }: { node: MemoView }) {
  assert(node.value, 'no memo value');
  const date = dayjs(node.value.createdAt);

  return (
    <div class="shadow-md rounded-lg border p-4 relative" attr:data-memo-id={node.id}>
      <div class="flex justify-between items-center">
        <div>
          <Show when={node.value.isPinned}>
            <span>Pinned</span>
          </Show>
          <time datetime={date.toISOString()} class="text-gray-400">
            {date.format('YYYY-MM-DD HH:mm:ss')}
          </time>
        </div>
        <Menu node={node} />
      </div>
      <Body node={node} />
      <div class="flex border-t">
        <button class="flex grow justify-center items-center">
          <LinkIcon />
          {node.value.referrers.length}
        </button>
        <button class="flex grow justify-center items-center">
          <MessageCircleIcon />
          {node.value.childrenCount}
        </button>
      </div>
    </div>
  );
}
