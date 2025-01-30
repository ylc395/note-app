import { AtSignIcon, ReplyIcon } from 'lucide-solid';
import assert from 'assert';
import { Show } from 'solid-js';

import type MemoView from '#domain/client/app/model/memo/MemoView';

export default function Operation({ memoView }: { memoView: MemoView }) {
  assert(memoView.value, 'no value');
  const buttonClassName = 'flex justify-center items-center text-sm text-gray-400';

  return (
    <div class="flex space-x-4 text-sm xl:mt-4">
      <Show when={memoView.isParent}>
        <button class={buttonClassName} onclick={memoView.toggleFollowup.bind(memoView)}>
          <ReplyIcon class="mr-1" />
          后续
          <span class="number-suffix">{memoView.value.followupsCount}</span>
        </button>
      </Show>
      <Show when={memoView.value.referrersCount > 0}>
        <button class={buttonClassName} onclick={memoView.toggleReferrers.bind(memoView)}>
          <AtSignIcon class="mr-1" />
          被提及 <span class="number-suffix">{memoView.value.referrersCount}</span>
        </button>
      </Show>
    </div>
  );
}
