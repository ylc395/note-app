import { ArrowDownIcon, ArrowUpIcon, ListIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import { Popover } from '@ark-ui/solid';

import ResultList from './ResultList';
import Input from './Input';
import { useContext } from '../../context';

export default function SearchBar() {
  const {
    viewer: {
      editor: { textFinder },
    },
  } = useContext()!;

  return (
    <div class="flex z-10 m-auto w-fit relative left-36">
      <Input />
      <Show when={textFinder.result?.total === 0}>
        <div>{textFinder.result?.isFinal ? '没有结果' : '搜索中...'}</div>
      </Show>
      <Show when={Number(textFinder.result?.total) > 0}>
        <div>
          {textFinder.result?.current}/{textFinder.result?.total}
        </div>
      </Show>
      <div class="ml-6">
        <button onClick={textFinder.prev}>
          <ArrowUpIcon />
        </button>
        <button onClick={textFinder.next}>
          <ArrowDownIcon />
        </button>
        <Popover.Root lazyMount unmountOnExit>
          <Popover.Trigger disabled={!textFinder.digests}>
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
