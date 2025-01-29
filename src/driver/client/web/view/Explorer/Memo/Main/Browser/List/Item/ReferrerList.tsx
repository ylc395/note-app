import { For, Show } from 'solid-js';
import assert from 'assert';

import type MemoView from '#domain/client/app/model/memo/MemoView';

export default function ReferrerList({ memoView }: { memoView: MemoView }) {
  assert(memoView.referrersQuery, 'no value');

  return (
    <Show when={memoView.referrersQuery.result.data && memoView.referrersQuery.result.data.length > 0}>
      <div>
        <For each={memoView.referrersQuery.result.data}>{(referrer) => <div>{referrer.sourceSnippet.text}</div>}</For>
      </div>
    </Show>
  );
}
