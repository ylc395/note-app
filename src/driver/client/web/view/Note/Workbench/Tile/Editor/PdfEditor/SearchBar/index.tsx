import { ArrowDownIcon, ArrowUpIcon, ListIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import { Popover } from '@ark-ui/solid';

import ResultList from './ResultList';
import Input from './Input';
import type TextFinder from './TextFinder';

export default function SearchBar(props: { textFinder: TextFinder }) {
  return (
    <div class="flex z-10 m-auto w-fit relative left-36">
      <Input textFinder={props.textFinder} />
      <Show when={props.textFinder.model.result?.total === 0}>
        <div>没有结果</div>
      </Show>
      <Show when={Number(props.textFinder.model.result?.total) > 0}>
        <div>
          {props.textFinder.model.result?.current}/{props.textFinder.model.result?.total}
        </div>
      </Show>
      <div class="ml-6">
        <button disabled={!props.textFinder.model.result?.total} onClick={() => props.textFinder.previous()}>
          <ArrowUpIcon />
        </button>
        <button disabled={!props.textFinder.model.result?.total} onClick={() => props.textFinder.next()}>
          <ArrowDownIcon />
        </button>
        <Popover.Root lazyMount unmountOnExit>
          <Popover.Trigger disabled={!props.textFinder.model.digests}>
            <ListIcon />
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content>
              <ResultList textFinder={props.textFinder} />
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
      </div>
    </div>
  );
}
