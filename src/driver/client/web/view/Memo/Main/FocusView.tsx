import { createEffect, createSignal, on, onCleanup, Show } from 'solid-js';
import { XIcon } from 'lucide-solid';

import MemoView from '#domain/client/app/model/memo/MemoView';
import { container } from '#domain/shared/infra/singletons';
import UIState from '#web/view/UIState';

import Item from './List/Item';

export default function FocusView() {
  const [getMemoView, setMemoView] = createSignal<MemoView>();
  const uiState = container.resolve(UIState);

  createEffect(
    on(
      () => uiState.value?.['memo.focusId'],
      (id) => {
        if (!id) {
          setMemoView(undefined);
          return;
        }
        const memoView = new MemoView({ memoId: id });
        setMemoView(memoView);
        onCleanup(() => memoView.destroy());
      },
    ),
  );

  return (
    <Show when={getMemoView()} keyed>
      {(memoView) => (
        <div class="bg-white absolute right-0 inset-y-0 z-20">
          <div class="flex justify-between">
            <h3>查看</h3>
            <button onClick={() => uiState.update({ 'memo.focusId': undefined })}>
              <XIcon />
            </button>
          </div>
          <Show when={memoView.valueQuery?.result.data}>{(memo) => <Item memo={memo()} />}</Show>
        </div>
      )}
    </Show>
  );
}
