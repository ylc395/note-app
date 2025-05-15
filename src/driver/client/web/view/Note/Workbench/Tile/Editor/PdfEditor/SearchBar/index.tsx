import { ArrowDownIcon, ArrowUpIcon, ListIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import { Popover } from '@ark-ui/solid';

import type TextSearcher from '#domain/client/app/model/note/editor/PdfEditor/TextSearcher';
import ResultList from './ResultList';
import { action } from 'mobx';

export default function SearchBar(props: { searcher: TextSearcher }) {
  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      props.searcher.search();
    }
  }

  function handleInput(e: InputEvent & { target: HTMLInputElement }) {
    props.searcher.keyword = e.target.value;
  }

  props.searcher.init();

  return (
    <div class="flex z-10 m-auto w-fit relative left-36">
      <input value={props.searcher.keyword} onKeyPress={handleKeyPress} onInput={action(handleInput)} />
      <Show when={props.searcher.searchResultCount > 0 && props.searcher.current} fallback={<div>没有结果</div>}>
        {(current) => (
          <div>
            {Number(current().index) + 1}/{props.searcher.searchResultCount}
          </div>
        )}
      </Show>
      <div>
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
