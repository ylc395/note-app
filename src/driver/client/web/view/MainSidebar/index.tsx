import { action } from 'mobx';
import { Popover } from '@ark-ui/solid';
import { BookTextIcon, LightbulbIcon, HashIcon, SearchIcon, StarIcon, SettingsIcon, Trash2Icon } from 'lucide-solid';
import { Portal } from 'solid-js/web';

import shell from '#web/infra/shell';

import container from '#utils/singletonContainer';
import UIState, { SidebarTabs } from '../UIState';
import Star from './Star';
import Topic from './Topic';

export default function Sidebar() {
  const uiState = container.resolve(UIState);
  const menuClassName = 'space-y-stack-s';
  const iconClassName = 'w-6 h-6 stroke-[1.5]';
  const buttonClassName =
    'relative p-inset-square-md flex justify-center items-center cursor-pointer rounded-lg text-brand-primary opacity-40 data-[selected]:opacity-100 data-[state="open"]:opacity-100';

  return (
    <div class="flex flex-col h-screen bg-surface-secondary relative overflow-auto flex-shrink-0 border-r-border-secondary border-r py-inset-square-md">
      <ul class={menuClassName}>
        <li>
          <a onClick={action(() => (uiState.explorer.type = SidebarTabs.Memo))} class={buttonClassName}>
            <LightbulbIcon class={iconClassName} />
          </a>
        </li>
        <li>
          <a onClick={action(() => (uiState.explorer.type = SidebarTabs.Note))} class={buttonClassName}>
            <BookTextIcon class={iconClassName} />
          </a>
        </li>
      </ul>
      <ul class={`${menuClassName} mt-stack-md pt-stack-md border-t border-t-border-secondary`}>
        <li>
          <Popover.Root lazyMount unmountOnExit positioning={{ placement: 'right-start' }}>
            <Popover.Trigger
              asChild={(childProps) => (
                <a class={buttonClassName} {...childProps()}>
                  <StarIcon class={iconClassName} />
                </a>
              )}
            />
            <Portal mount={shell.appRoot}>
              <Popover.Positioner>
                <Popover.Content>
                  <Star />
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        </li>
        <li>
          <Popover.Root lazyMount unmountOnExit positioning={{ placement: 'right-start' }}>
            <Popover.Trigger
              asChild={(childProps) => (
                <a {...childProps()} class={buttonClassName}>
                  <HashIcon class={iconClassName} />
                </a>
              )}
            />
            <Portal mount={shell.appRoot}>
              <Popover.Positioner>
                <Popover.Content>
                  <Topic />
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        </li>
        <li>
          <a class={buttonClassName}>
            <SearchIcon class={iconClassName} />
          </a>
        </li>
      </ul>
      <ul class={`mt-auto ${menuClassName}`}>
        <li>
          <a class={buttonClassName}>
            <Trash2Icon class={iconClassName} />
          </a>
        </li>
        <li>
          <a class={buttonClassName}>
            <SettingsIcon class={iconClassName} />
          </a>
        </li>
      </ul>
    </div>
  );
}
