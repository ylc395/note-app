import { onCleanup, Show } from 'solid-js';
import dayjs from 'dayjs';
import { LinkIcon, MessageCircleIcon } from 'lucide-solid';

import MemoView from '#domain/client/app/model/memo/MemoView';
import type { MemoVO } from '#domain/shared/model/memo';
import Menu from './Menu';
import Body from './Body';

export default function Item({ memo, parent }: { memo: MemoVO; parent: MemoView }) {
  const date = dayjs(memo.createdAt);
  const memoView = new MemoView({ value: memo, parent });

  onCleanup(() => {
    memoView.destroy();
  });

  return (
    <div class="shadow-md rounded-lg border p-4 relative" attr:data-memo-id={memo.id}>
      <div class="flex justify-between items-center">
        <div>
          <Show when={memo.isPinned}>
            <span>Pinned</span>
          </Show>
          <time datetime={date.toISOString()} class="text-gray-400">
            {date.format('YYYY-MM-DD HH:mm:ss')}
          </time>
        </div>
        <Menu memoView={memoView} />
      </div>
      <Body memoView={memoView} />
      <div class="flex border-t">
        <button class="flex grow justify-center items-center border-r">
          <LinkIcon />
          {memo.referrers.length}
        </button>
        <button class="flex grow justify-center items-center">
          <MessageCircleIcon />
          {memo.childrenCount}
        </button>
      </div>
    </div>
  );
}
