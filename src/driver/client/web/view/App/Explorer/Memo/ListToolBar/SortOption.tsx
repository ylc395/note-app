import { Menu } from '@ark-ui/solid';
import { ArrowDownWideNarrowIcon, ArrowUpWideNarrowIcon, CheckIcon, ShuffleIcon } from 'lucide-solid';

import Button from '#web/view/components/Button';
import type Filter from '#domain/client/app/model/memo/List/Filter';
import { useContext } from '../context';
import { Match, Switch } from 'solid-js';

export default function SortMenu() {
  const {
    memoList: { filter },
  } = useContext()!;

  const checkboxClass = 'size-4';

  return (
    <Menu.Root>
      <Menu.Trigger
        asChild={(childProps) => (
          <Button {...childProps()} size="small">
            <Switch>
              <Match when={filter.order === 'random'}>
                <ShuffleIcon />
                随机
              </Match>
              <Match when={filter.order === 'asc'}>
                <ArrowUpWideNarrowIcon />
                升序
              </Match>
              <Match when={filter.order === 'desc'}>
                <ArrowDownWideNarrowIcon />
                降序
              </Match>
            </Switch>
          </Button>
        )}
      />
      <Menu.Positioner>
        <Menu.Content class="z-10 w-24 bg-surface-raised border border-border-primary rounded-lg shadow-lg p-1">
          <Menu.RadioItemGroup
            value={filter.order}
            onValueChange={({ value }) => {
              filter.setOrder(value as NonNullable<Filter['order']>);
            }}
          >
            <Menu.RadioItem
              class="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-fg-primary hover:bg-bg-hover cursor-pointer data-[checked]:bg-bg-accent-subtle data-[checked]:text-fg-accent-subtle transition-colors"
              value="desc"
            >
              降序
              <Menu.ItemIndicator>
                <CheckIcon class={checkboxClass} />
              </Menu.ItemIndicator>
            </Menu.RadioItem>
            <Menu.RadioItem
              class="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-fg-primary hover:bg-bg-hover cursor-pointer data-[checked]:bg-bg-accent-subtle data-[checked]:text-fg-accent-subtle transition-colors"
              value="asc"
            >
              升序
              <Menu.ItemIndicator>
                <CheckIcon class={checkboxClass} />
              </Menu.ItemIndicator>
            </Menu.RadioItem>
            <Menu.RadioItem
              disabled={!filter.canBeRandom}
              class="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-fg-primary hover:bg-bg-hover cursor-pointer data-[checked]:bg-bg-accent-subtle data-[checked]:text-fg-accent-subtle transition-colors"
              value="random"
            >
              随机
              <Menu.ItemIndicator>
                <CheckIcon class={checkboxClass} />
              </Menu.ItemIndicator>
            </Menu.RadioItem>
          </Menu.RadioItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
