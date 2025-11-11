import { For, Show, type JSX } from 'solid-js';
import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';
import { SearchFields, type MatchRecord } from '#domain/shared/model/search';

import Empty from './Empty';

export default function SearchResult() {
  const searcher = container.resolve(Searcher);

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

  return (
    <div class="grow min-h-0 flex flex-col">
      <Show when={searcher.result} fallback={'搜索中'}>
        <For each={searcher.result} fallback={<Empty />}>
          {(row) => (
            <div>
              <div class="flex space-x-inset-square-md">
                <div class="shrink-0">
                  {row.matches[SearchFields.Title] ? highlight(row.matches[SearchFields.Title]) : row.title}
                </div>
                <div class="whitespace-pre">/{row.path.map(({ title }) => title).join('/')}</div>
              </div>
              <div>{row.matches[SearchFields.Body] ? highlight(row.matches[SearchFields.Body]) : row.bodyPreview}</div>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}
