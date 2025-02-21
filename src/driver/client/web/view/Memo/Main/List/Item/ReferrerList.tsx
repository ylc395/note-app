import { For, Show } from 'solid-js';
import assert from 'assert';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import { container } from '#domain/shared/infra/singletons';
import MemoList from '#domain/client/app/model/memo/List';

export default function ReferrerList({ memoView }: { memoView: MemoView }) {
  assert(memoView.referrersQuery, 'no value');
  const memoList = container.resolve(MemoList);

  return (
    <Show when={memoView.referrersQuery.result.data && memoView.referrersQuery.result.data.length > 0}>
      <div>
        <For each={memoView.referrersQuery.result.data}>
          {(referrer) => (
            <div onClick={() => memoList.setFocusId(referrer.sourceEntity.id)}>{referrer.sourceSnippet.text}</div>
          )}
        </For>
      </div>
    </Show>
  );
}
