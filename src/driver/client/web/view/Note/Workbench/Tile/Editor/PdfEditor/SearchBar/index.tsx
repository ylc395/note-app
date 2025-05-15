import { ArrowDownIcon, ArrowUpIcon, ListIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import { Popover } from '@ark-ui/solid';

import type TextSearcher from '#domain/client/app/model/note/editor/PdfEditor/TextSearcher';
import ResultList from './ResultList';
import Input from './Input';

export default function SearchBar(props: { searcher: TextSearcher }) {
  props.searcher.init();

  return (
    <div class="flex z-10 m-auto w-fit relative left-36">
      <Input searcher={props.searcher} />
      <Show when={props.searcher.searchResult && props.searcher.searchResultCount === 0}>
        <div>没有结果{props.searcher.options.isCurrentPageOnly && `(第${props.searcher.currentPage}页)`}</div>
      </Show>
      <Show when={props.searcher.searchResultCount > 0 && props.searcher.current}>
        {(current) => (
          <div>
            {Number(current().index) + 1}/{props.searcher.searchResultCount}
            {props.searcher.options.isCurrentPageOnly && `(第${props.searcher.currentPage}页)`}
          </div>
        )}
      </Show>
      <div class="ml-6">
        <button
          disabled={!props.searcher.current || props.searcher.current.index === 0}
          onClick={() => props.searcher.goPrevious()}
        >
          <ArrowUpIcon />
        </button>
        <button
          disabled={!props.searcher.current || props.searcher.current.index === props.searcher.searchResultCount - 1}
          onClick={() => props.searcher.goNext()}
        >
          <ArrowDownIcon />
        </button>
        <Popover.Root>
          <Popover.Trigger disabled={!props.searcher.searchResult}>
            <ListIcon />
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content>
              <ResultList searchResult={props.searcher.searchResult!} />
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
      </div>
    </div>
  );
}
