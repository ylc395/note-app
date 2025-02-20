import { For, Show } from 'solid-js';
import assert from 'assert';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import { container } from '#domain/shared/infra/singletons';
import UIState from '#web/view/UIState';

export default function ReferrerList({ memoView }: { memoView: MemoView }) {
  assert(memoView.referrersQuery, 'no value');
  const uiState = container.resolve(UIState);

  return (
    <Show when={memoView.referrersQuery.result.data && memoView.referrersQuery.result.data.length > 0}>
      <div>
        <For each={memoView.referrersQuery.result.data}>
          {(referrer) => (
            <div onClick={() => uiState.update({ 'memo.focusId': referrer.sourceEntity.id })}>
              {referrer.sourceSnippet.text}
            </div>
          )}
        </For>
      </div>
    </Show>
  );
}
