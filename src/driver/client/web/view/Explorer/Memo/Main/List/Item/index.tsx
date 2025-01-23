import { onCleanup, Show } from 'solid-js';
import dayjs from 'dayjs';
import { Link2Icon, ReplyIcon } from 'lucide-solid';

import MemoView from '#domain/client/app/model/memo/MemoView';
import type { MemoVO } from '#domain/shared/model/memo';

import Menu from './Menu';
import Body from './Body';
import ChildrenList from './ChildrenList';

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
      <Show when={memoView.isParent}>
        <div class="flex border-t">
          <button class="flex grow justify-center items-center border-r">
            <Link2Icon />
            {memo.referrers.length}
          </button>
          <button class="flex grow justify-center items-center" onclick={memoView.toggleExpand.bind(memoView)}>
            <ReplyIcon />
            {memo.childrenCount}
          </button>
        </div>
      </Show>
      <Show when={memoView.isExpand}>
        <ChildrenList memoView={memoView} />
      </Show>
    </div>
  );
}
