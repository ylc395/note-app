import { onCleanup, Show, createEffect, createMemo } from 'solid-js';
import dayjs from 'dayjs';
import { Link2Icon, ReplyIcon } from 'lucide-solid';

import MemoView from '#domain/client/app/model/memo/MemoView';
import type { MemoVO } from '#domain/shared/model/memo';

import Menu from './Menu';
import Body from './Body';
import ChildrenList from './ChildrenList';

export default function Item(props: { memo: MemoVO; parent: MemoView }) {
  const date = createMemo(() => dayjs(props.memo.createdAt));
  const memoView = new MemoView({ value: props.memo, parent: props.parent });

  createEffect(() => {
    memoView.setValue(props.memo);
  });

  onCleanup(() => {
    memoView.destroy();
  });

  return (
    <div class="shadow-md rounded-lg border p-4 relative" attr:data-memo-id={props.memo.id}>
      <div class="flex justify-between items-center">
        <div>
          <Show when={props.memo.isPinned}>
            <span>Pinned</span>
          </Show>
          <time datetime={date().toISOString()} class="text-gray-400">
            {date().format('YYYY-MM-DD HH:mm:ss')}
          </time>
        </div>
        <Menu memoView={memoView} />
      </div>
      <Body memoView={memoView} />
      <Show when={memoView.isParent}>
        <div class="flex border-t">
          <button class="flex grow justify-center items-center border-r">
            <Link2Icon /> Referrers
            <span class="ml-2">{props.memo.referrers.length}</span>
          </button>
          <button class="flex grow justify-center items-center" onclick={memoView.toggleExpand.bind(memoView)}>
            <ReplyIcon /> Follow-up
            <span class="ml-2">{props.memo.childrenCount}</span>
          </button>
        </div>
      </Show>
      <Show when={memoView.isExpand}>
        <ChildrenList memoView={memoView} />
      </Show>
    </div>
  );
}
