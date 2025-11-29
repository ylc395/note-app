import { onCleanup, Show, createEffect, createMemo } from 'solid-js';
import dayjs from 'dayjs';

import type MemoList from '#domain/client/app/model/memo/List';
import type { MemoVO } from '#domain/shared/model/memo';
import MemoView from '#domain/client/app/model/memo/MemoView';

import Menu from './Menu';
import Body from './Body';
import FollowupList from './FollowupList';
import Operation from './Operation';
import ReferrerList from './ReferrerList';
import RevisionModal from './RevisionModal';

export default function Item(props: { memo: MemoVO; parent?: MemoView | MemoList }) {
  const date = createMemo(() => dayjs(props.memo.createdAt));
  let divRef: HTMLDivElement | undefined;
  const memoView = new MemoView({ value: props.memo, parent: props.parent });

  createEffect(() => {
    memoView.setValue(props.memo);
  });

  onCleanup(() => {
    memoView.destroy();
  });

  return (
    <div ref={divRef} class="shadow-md rounded-lg border p-4 relative bg-white before:con">
      <div class="flex justify-between items-center">
        <div class="flex text-gray-400">
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
