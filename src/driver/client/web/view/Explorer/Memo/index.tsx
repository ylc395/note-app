import { Tabs } from '@ark-ui/solid';
import { action } from 'mobx';

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
      onValueChange={action(() => (uiState.isMenuVisible = 'visible'))}
    >
      <Sidebar />
      <div class="flex max-w-screen-md min-w-0 w-full lg:w-3/4">
        <Tabs.Content class="w-full" value="memos">
          <Main />
        </Tabs.Content>
        <Tabs.Content class="w-full" value="stats">
          Stats
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
}
