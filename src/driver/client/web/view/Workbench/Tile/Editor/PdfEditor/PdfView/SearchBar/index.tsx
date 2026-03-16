import { ArrowDownIcon, ArrowUpIcon, ListIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import { Popover } from '@ark-ui/solid';

import ResultList from './ResultList';
import Input from './Input';
import { useContext } from '../context';

export default function SearchBar() {
  const {
    viewer: { editor, viewer },
  } = useContext()!;

  return (
    <div class="flex z-10 m-auto w-fit relative left-36">
      <Input />
      <Show when={editor.textFinder.result?.total === 0}>
        <div>没有结果</div>
      </Show>
      <Show when={Number(editor.textFinder.result?.total) > 0}>
        <div>
          {editor.textFinder.result?.current}/{editor.textFinder.result?.total}
        </div>
      </Show>
      <div class="ml-6">
        <button onClick={() => viewer.textFinder.prev()}>
          <ArrowUpIcon />
        </button>
        <button onClick={() => viewer.textFinder.next()}>
          <ArrowDownIcon />
        </button>
        <Popover.Root lazyMount unmountOnExit>
          <Popover.Trigger disabled={!editor.textFinder.digests}>
            <ListIcon />
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content>
              <ResultList />
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
      </div>
    </div>
  );
}
