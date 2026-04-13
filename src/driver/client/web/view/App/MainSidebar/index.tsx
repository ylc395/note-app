import { action } from 'mobx';
import { Popover, usePopover } from '@ark-ui/solid';
import { BookTextIcon, LightbulbIcon, HashIcon, SearchIcon, StarIcon, SettingsIcon, Trash2Icon } from 'lucide-solid';
import { Portal } from 'solid-js/web';

import shell from '#web/infra/shell';

import container from '#utils/singletonContainer';
import UIState, { SidebarTabs } from '../UIState';
import Star from './Star';
import Topic from './Topic';
import type { JSX } from 'solid-js';

function IconPopover(props: {
  buttonClassName: string;
  icon: JSX.Element;
  children: (ctx: { closePopover: () => void }) => JSX.Element;
}) {
  const popover = usePopover({
    positioning: { placement: 'right-start' },
  });

  const ctx = {
    closePopover: () => popover().setOpen(false),
  };

  return (
    <Popover.RootProvider lazyMount unmountOnExit value={popover}>
      <Popover.Trigger
        asChild={(childProps) => (
          <a class={props.buttonClassName} {...childProps()}>
            {props.icon}
          </a>
        )}
      />
      <Portal mount={shell.appRoot}>
        <Popover.Positioner>
          <Popover.Content>{props.children(ctx)}</Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.RootProvider>
  );
}

export default function Sidebar() {
  const uiState = container.resolve(UIState);
  const menuClassName = 'space-y-2';
  const iconClassName = 'w-6 h-6 stroke-[1.5]';
  const buttonClassName =
    'relative p-2 flex justify-center items-center cursor-pointer rounded-lg text-fg-primary data-[state="closed"]:opacity-40';

  return (
    <div class="flex flex-col h-screen bg-bg-secondary relative overflow-auto flex-shrink-0 border-r-border-secondary border-r py-2">
      <ul class={menuClassName}>
        <li>
          <a
            onClick={action(() => (uiState.explorer.type = SidebarTabs.Memo))}
            class={buttonClassName}
            data-state={uiState.explorer.type === SidebarTabs.Memo ? 'open' : 'closed'}
          >
            <LightbulbIcon class={iconClassName} />
          </a>
        </li>
        <li>
          <a
            onClick={action(() => (uiState.explorer.type = SidebarTabs.Note))}
            class={buttonClassName}
            data-state={uiState.explorer.type === SidebarTabs.Note ? 'open' : 'closed'}
          >
            <BookTextIcon class={iconClassName} />
          </a>
        </li>
      </ul>
      <ul class={`${menuClassName} mt-4 pt-4 border-t border-t-border-secondary`}>
        <li>
          <IconPopover buttonClassName={buttonClassName} icon={<StarIcon class={iconClassName} />}>
            {({ closePopover }) => <Star onOpen={closePopover} />}
          </IconPopover>
        </li>
        <li>
          <IconPopover buttonClassName={buttonClassName} icon={<HashIcon class={iconClassName} />}>
            {({ closePopover }) => <Topic onOpen={closePopover} />}
          </IconPopover>
        </li>
        <li>
          <a class={buttonClassName} data-state="closed">
            <SearchIcon class={iconClassName} />
          </a>
        </li>
      </ul>
      <ul class={`mt-auto ${menuClassName}`}>
        <li>
          <a class={buttonClassName} data-state="closed">
            <Trash2Icon class={iconClassName} />
          </a>
        </li>
        <li>
          <a class={buttonClassName} data-state="closed">
            <SettingsIcon class={iconClassName} />
          </a>
        </li>
      </ul>
    </div>
  );
}
