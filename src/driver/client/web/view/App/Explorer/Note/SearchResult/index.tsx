import { createEffect, createMemo, createSignal, For, on, Show } from 'solid-js';
import { ShrinkIcon, ExpandIcon } from 'lucide-solid';

import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';

import Empty from './Empty';
import Item from './Item';

export default function SearchResult() {
  const searcher = container.resolve(Searcher);
  const [closeCount, setCloseCount] = createSignal(0);
  const [allOpen, setAllOpen] = createSignal<boolean>();
  const totalNoteCount = createMemo(() => searcher.result?.length);

  function onToggle(v: boolean) {
    setAllOpen(undefined);
    setCloseCount((count) => count + (v ? -1 : 1));
  }

  createEffect(
    on(
      () => searcher.result,
      () => setCloseCount(0),
    ),
  );

  return (
    <>
      <Show when={searcher.result} fallback={'搜索中'}>
        <Show when={searcher.result!.length > 0}>
          <div class="flex justify-between">
            <div>共 {totalNoteCount()} 个相关项</div>
            <div class="flex">
              <button disabled={closeCount() === 0} onClick={() => setAllOpen(true)} class="button button-square-md">
                <ExpandIcon />
              </button>
              <button
                disabled={closeCount() === totalNoteCount()}
                onClick={() => setAllOpen(false)}
                class="button button-square-md"
              >
                <ShrinkIcon />
              </button>
            </div>
          </div>
        </Show>
        <Show when={searcher.result} keyed>
          <div class="flex flex-col min-h-0 overflow-auto scrollbar-stable grow">
            <For each={searcher.result} fallback={<Empty />}>
              {(row) => <Item row={row} open={allOpen()} onToggle={onToggle} />}
            </For>
          </div>
        </Show>
      </Show>
    </>
  );
}
