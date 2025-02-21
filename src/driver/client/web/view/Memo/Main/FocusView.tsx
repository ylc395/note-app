import { createEffect, createSignal, on, onCleanup, Show } from 'solid-js';
import { XIcon } from 'lucide-solid';

import { container } from '#domain/shared/infra/singletons';
import MemoView from '#domain/client/app/model/memo/MemoView';
import MemoList from '#domain/client/app/model/memo/List';

import Item from './List/Item';

export default function FocusView() {
  const [getMemoView, setMemoView] = createSignal<MemoView>();
  const memoList = container.resolve(MemoList);

  createEffect(
    on(
      () => memoList.focusedId,
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
            <button onClick={() => memoList.setFocusId(undefined)}>
              <XIcon />
            </button>
          </div>
          <Show when={memoView.valueQuery?.result.data}>{(memo) => <Item memo={memo()} />}</Show>
        </div>
      )}
    </Show>
  );
}
