import { For } from 'solid-js';
import container from '#utils/singletonContainer';
import Searcher from '#domain/client/app/model/note/Searcher';
import { SearchFields } from '#domain/shared/model/search';

export default function SearchResult() {
  const searcher = container.resolve(Searcher);

  return (
    <div class="grow min-h-0 flex flex-col">
      <For each={searcher.result}>
        {(row) => (
          <div>
            <div>
              <div>{row.title}</div>
              <div>{row.path.map(({ title }) => title).join('/')}</div>
            </div>
            <div>{row.matches[SearchFields.Body]?.text}</div>
          </div>
        )}
      </For>
    </div>
  );
}
