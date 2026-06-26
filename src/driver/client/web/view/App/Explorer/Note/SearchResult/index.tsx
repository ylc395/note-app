import { createEffect, createMemo, createSignal, For, on, Show } from 'solid-js';
import { ShrinkIcon, ExpandIcon } from 'lucide-solid';

import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';
import Button from '#web/view/components/Button';

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
    <Show
      when={searcher.result}
      fallback={<div class="flex items-center justify-center py-8 text-sm text-fg-tertiary">搜索中…</div>}
    >
      <Show when={searcher.result!.length > 0}>
        <div class="flex justify-between items-center px-1 pb-2 mb-1 text-sm text-fg-secondary border-b border-border-secondary">
          <div>
            共 <span class="font-medium text-fg-primary">{totalNoteCount()}</span> 个相关项
          </div>
          <div class="flex gap-0.5">
            <Button square title="全部展开" disabled={closeCount() === 0} onClick={() => setAllOpen(true)}>
              <ExpandIcon />
            </Button>
            <Button
              square
              title="全部折叠"
              disabled={closeCount() === totalNoteCount()}
              onClick={() => setAllOpen(false)}
            >
              <ShrinkIcon />
            </Button>
          </div>
        </div>
      </Show>
      <Show when={searcher.result} keyed>
        <div class="flex flex-col min-h-0 overflow-auto scrollbar-stable grow mt-2">
          <For each={searcher.result} fallback={<Empty />}>
            {(row) => <Item row={row} open={allOpen()} onToggle={onToggle} />}
          </For>
        </div>
      </Show>
    </Show>
  );
}
