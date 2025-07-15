import { Tabs } from '@ark-ui/solid/tabs';
import { BookTextIcon, LightbulbIcon, HashIcon, SearchIcon, StarIcon, RecycleIcon, SettingsIcon } from 'lucide-solid';

import container from '#utils/singletonContainer';
import UIState, { SidebarTabs } from './UIState';
import { createMemo } from 'solid-js';

export default function Sidebar() {
  const uiState = container.resolve(UIState);
  const selectedTab = createMemo(() => uiState.get('app.sidebar'));

  const menuClassName = 'menu space-y-1';
  const iconClassName = 'w-5';

  return (
    <Tabs.List class="flex flex-col h-screen bg-base-300 relative overflow-auto flex-shrink-0">
      <ul class={menuClassName}>
        <Tabs.Trigger
          value={SidebarTabs.Memo}
          asChild={(props) => (
            <li>
              <a {...props()} classList={{ 'menu-active': selectedTab() === SidebarTabs.Memo }}>
                <LightbulbIcon class={iconClassName} />
              </a>
            </li>
          )}
        />
        <Tabs.Trigger
          value={SidebarTabs.Note}
          asChild={(props) => (
            <li>
              <a {...props()} classList={{ 'menu-active': selectedTab() === SidebarTabs.Note }}>
                <BookTextIcon class={iconClassName} />
              </a>
            </li>
          )}
        />
      </ul>
      <ul class={menuClassName}>
        <li>
          <a>
            <StarIcon class={iconClassName} />
          </a>
        </li>
        <li>
          <a>
            <HashIcon class={iconClassName} />
          </a>
        </li>
        <li>
          <a>
            <SearchIcon class={iconClassName} />
          </a>
        </li>
      </ul>
      <ul class={`mt-auto w- ${menuClassName}`}>
        <li>
          <a>
            <RecycleIcon class={iconClassName} />
          </a>
        </li>
        <li>
          <a>
            <SettingsIcon class={iconClassName} />
          </a>
        </li>
      </ul>
    </Tabs.List>
  );
}
