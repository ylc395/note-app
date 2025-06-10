import { ArrowDownIcon, ArrowUpIcon, ListIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import { Popover } from '@ark-ui/solid';

import ResultList from './ResultList';
import Input from './Input';
import type Searcher from './Searcher';

export default function SearchBar(props: { searcher: Searcher }) {
  return (
    <div class="flex z-10 m-auto w-fit relative left-36">
      <Input searcher={props.searcher} />
      <Show when={props.searcher.textFinder.matchesCount?.total === 0}>
        <div>没有结果</div>
      </Show>
      <Show when={Number(props.searcher.textFinder.matchesCount?.total) > 0}>
        <div>
          {props.searcher.textFinder.matchesCount?.current}/{props.searcher.textFinder.matchesCount?.total}
        </div>
      </Show>
      <div class="ml-6">
        <button disabled={!props.searcher.textFinder.matchesCount?.total} onClick={() => props.searcher.previous()}>
          <ArrowUpIcon />
        </button>
        <button disabled={!props.searcher.textFinder.matchesCount?.total} onClick={() => props.searcher.next()}>
          <ArrowDownIcon />
        </button>
        <Popover.Root lazyMount unmountOnExit>
          <Popover.Trigger disabled={!props.searcher.textFinder.digests}>
            <ListIcon />
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content>
              <ResultList searcher={props.searcher} />
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
      </div>
    </div>
  );
}
