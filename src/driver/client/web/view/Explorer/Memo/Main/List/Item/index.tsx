import { onCleanup, Show, createEffect, createMemo } from 'solid-js';
import dayjs from 'dayjs';
import { PinIcon } from 'lucide-solid';

import type MemoList from '#domain/client/app/model/memo/List';
import MemoView from '#domain/client/app/model/memo/MemoView';
import type { MemoItem } from '#domain/client/app/model/memo/List/item';

import Menu from './Menu';
import Body from './Body';
import FollowupList from './FollowupList';
import Operation from './Operation';
import ReferrerList from './ReferrerList';
import RevisionModal from './RevisionModal';

export default function Item(props: { memo: MemoItem; parent?: MemoView | MemoList }) {
  const date = createMemo(() => dayjs(props.memo.createdAt));
  let divRef: HTMLDivElement | undefined;
  const memoView = new MemoView({ value: props.memo, parent: props.parent });

  createEffect(() => {
    memoView.setValue(props.memo);

    if (props.memo.justCreated) {
      divRef?.scrollIntoView();
    }
  });

  onCleanup(() => {
    memoView.destroy();
  });

  return (
    <div
      ref={divRef}
      class="shadow-md rounded-lg border p-4 relative bg-white before:con"
      classList={{ 'animate__animated animate__slideInDown animate__fast': Boolean(props.memo.justCreated) }}
    >
      <Show when={props.memo.justCreated === 'omit'}>
        <span class="absolute top-0 left-0">新</span>
      </Show>
      <div class="flex justify-between items-center">
        <div class="flex text-gray-400">
          <Show when={props.memo.isPinned}>
            <span class="flex items-center mr-2 text-red-300">
              <PinIcon />
              Pinned
            </span>
          </Show>
          <time datetime={date().toISOString()}>{date().format('YYYY-MM-DD HH:mm:ss')}</time>
        </div>
        <Menu memoView={memoView} />
      </div>
      <Body memoView={memoView} />
      <Operation memoView={memoView} />
      <Show when={memoView.visiblePanel === 'followup'}>
        <FollowupList memoView={memoView} />
      </Show>
      <Show when={memoView.visiblePanel === 'referrers'}>
        <ReferrerList memoView={memoView} />
      </Show>
      <RevisionModal memoView={memoView} />
    </div>
  );
}
