import { createEffect, createMemo, createSignal, For, on, Show } from 'solid-js';
import { ShrinkIcon, ExpandIcon } from 'lucide-solid';
import { Refs } from '@solid-primitives/refs';

import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';

import Empty from './Empty';
import Item from './Item';

export default function SearchResult() {
  const searcher = container.resolve(Searcher);
  const [openCount, setOpenCount] = createSignal(0);
  const totalNoteCount = createMemo(() => searcher.result?.length);
  let detailElements: HTMLDetailsElement[] | undefined;

  createEffect(
    on(
      () => searcher.result,
      () => setOpenCount(0),
    ),
  );

  function toggleAll(value: boolean) {
    detailElements?.forEach((el) => (el.open = value));
  }

  return (
    <>
      <Show when={searcher.result} fallback={'搜索中'}>
        <Show when={searcher.result!.length > 0}>
          <div class="flex justify-between">
            <div>共 {totalNoteCount()} 个相关项</div>
            <div class="flex">
              <button
                disabled={openCount() === totalNoteCount()}
                onClick={() => toggleAll(true)}
                class="button button-square-md"
              >
                <ExpandIcon />
              </button>
              <button disabled={openCount() === 0} onClick={() => toggleAll(false)} class="button button-square-md">
                <ShrinkIcon />
              </button>
            </div>
          </div>
        </Show>
        <div class="flex flex-col min-h-0 overflow-auto scrollbar-stable">
          <Refs ref={detailElements}>
            <For each={searcher.result} fallback={<Empty />}>
              {(row) => <Item row={row} onToggle={(v) => setOpenCount((count) => count + (v ? 1 : -1))} />}
            </For>
          </Refs>
        </div>
      </Show>
    </>
  );
}
