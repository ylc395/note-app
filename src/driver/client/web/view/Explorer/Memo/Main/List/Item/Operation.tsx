import { Link2Icon, ReplyIcon } from 'lucide-solid';
import assert from 'assert';
import { Show } from 'solid-js';

import type MemoView from '#domain/client/app/model/memo/MemoView';

export default function Operation({ memoView }: { memoView: MemoView }) {
  assert(memoView.value, 'no value');
  const buttonClassName = 'flex justify-center items-center';

  return (
    <div class="flex space-x-4">
      <Show when={memoView.isParent}>
        <button class={buttonClassName} onclick={memoView.toggleFollowup.bind(memoView)}>
          <ReplyIcon class="ml-2" />
          Follow-up
          <span class="ml-2">{memoView.value.childrenCount}</span>
        </button>
      </Show>
      <Show when={memoView.value.referrersCount > 0}>
        <button class={buttonClassName} onclick={memoView.toggleReferrers.bind(memoView)}>
          <Link2Icon class="mr-1" />
          Referrers
          <span class="ml-2">{memoView.value.referrersCount}</span>
        </button>
      </Show>
    </div>
  );
}
