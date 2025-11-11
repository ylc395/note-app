import { createEffect, createMemo, createSignal, For, on, Show, type JSX } from 'solid-js';
import { ShrinkIcon, ExpandIcon } from 'lucide-solid';
import { Refs } from '@solid-primitives/refs';

import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';
import { SearchFields, type MatchRecord } from '#domain/shared/model/search';

import Empty from './Empty';

export default function SearchResult() {
  const searcher = container.resolve(Searcher);
  const [openCount, setOpenCount] = createSignal(0);
  const totalNoteCount = createMemo(() => new Set(searcher.result?.map(({ id, main }) => main?.id ?? id)).size);
  let detailElements: HTMLDetailsElement[] | undefined;

  createEffect(
    on(
      () => searcher.result,
      () => setOpenCount(0),
    ),
  );

  function highlight({ text, highlights }: MatchRecord) {
    const htmls: JSX.Element[] = [];

    let previous: { start: number; end: number } | undefined;

    for (const range of highlights) {
      htmls.push(
        text.slice(previous ? previous.end : 0, range.start),
        <mark>{text.slice(range.start, range.end)}</mark>,
      );
      previous = range;
    }

    htmls.push(text.slice(previous!.end));
    return htmls;
  }

  function toggleAll(value: boolean) {
    detailElements?.forEach((el) => (el.open = value));
  }

  return (
    <div class="grow min-h-0 flex flex-col">
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
        <Refs ref={detailElements}>
          <For each={searcher.result} fallback={<Empty />}>
            {(row) => (
              <details
                open
                class="text-sm mb-stack-s"
                // 这个方法在初始化的时候就会被调用一次
                onToggle={(e) => setOpenCount((count) => count + ((e.target as HTMLDetailsElement).open ? 1 : -1))}
              >
                <summary class="flex space-x-inset-square-md items-center">
                  <div class="shrink-0">
                    {row.matches[SearchFields.Title] ? highlight(row.matches[SearchFields.Title]) : row.title}
                  </div>
                  <div class="whitespace-pre text-xs text-text-tertiary">
                    /{row.path.map(({ title }) => title).join('/')}
                  </div>
                </summary>
                <p class="text-text-secondary">
                  {row.matches[SearchFields.Body] ? highlight(row.matches[SearchFields.Body]) : row.bodyPreview}
                </p>
              </details>
            )}
          </For>
        </Refs>
      </Show>
    </div>
  );
}
