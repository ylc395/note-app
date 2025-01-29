import { AtSignIcon, ReplyIcon } from 'lucide-solid';
import assert from 'assert';
import { Show } from 'solid-js';

import type MemoView from '#domain/client/app/model/memo/MemoView';

export default function Operation({ memoView }: { memoView: MemoView }) {
  assert(memoView.value, 'no value');
  const buttonClassName = 'flex justify-center items-center text-sm text-gray-400';
  const numberClassName = 'ml-1 bg-gray-200 px-1 rounded-md';

  return (
    <div class="flex space-x-4 text-sm xl:mt-4">
      <Show when={memoView.isParent}>
        <button class={buttonClassName} onclick={memoView.toggleFollowup.bind(memoView)}>
          <ReplyIcon class="mr-1" />
          后续
          <span class={numberClassName}>{memoView.value.followupsCount}</span>
        </button>
      </Show>
      <Show when={memoView.value.referrersCount > 0}>
        <button class={buttonClassName} onclick={memoView.toggleReferrers.bind(memoView)}>
          <AtSignIcon class="mr-1" />
          被提及 <span class={numberClassName}>{memoView.value.referrersCount}</span>
        </button>
      </Show>
    </div>
  );
}
