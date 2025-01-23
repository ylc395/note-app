import { Tabs } from '@ark-ui/solid';
import { action } from 'mobx';
import { TriangleIcon } from 'lucide-solid';

import Sidebar from './Sidebar';
import Main from './Main';
import uiState from './uiState';

export default function MemoExplorer() {
  return (
    <Tabs.Root
      orientation="vertical"
      lazyMount
      class="flex h-screen px-4 mx-auto justify-center"
      defaultValue="memos"
      onValueChange={action(() => (uiState.isMenuVisible = false))}
    >
      <Sidebar />
      <div class="flex max-w-screen-md w-full lg:w-3/4">
        <button class="lg:hidden" onclick={action(() => (uiState.isMenuVisible = true))}>
          <TriangleIcon class="rotate-90" />
        </button>
        <Tabs.Content class="grow" value="memos">
          <Main />
        </Tabs.Content>
        <Tabs.Content class="grow" value="stats">
          Stats
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
}
