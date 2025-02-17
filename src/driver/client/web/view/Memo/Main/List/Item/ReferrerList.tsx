import { action } from 'mobx';
import { For, Show } from 'solid-js';
import assert from 'assert';

import type MemoView from '#domain/client/app/model/memo/MemoView';
import uiState from '#web/view/Memo/uiState';

export default function ReferrerList({ memoView }: { memoView: MemoView }) {
  assert(memoView.referrersQuery, 'no value');

  return (
    <Show when={memoView.referrersQuery.result.data && memoView.referrersQuery.result.data.length > 0}>
      <div>
        <For each={memoView.referrersQuery.result.data}>
          {(referrer) => (
            <div onClick={action(() => (uiState.focusMemoId = referrer.sourceEntity.id))}>
              {referrer.sourceSnippet.text}
            </div>
          )}
        </For>
      </div>
    </Show>
  );
}
