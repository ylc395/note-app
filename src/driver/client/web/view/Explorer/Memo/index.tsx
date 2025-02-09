import { Tabs } from '@ark-ui/solid';
import { action } from 'mobx';

import Sidebar from './Sidebar';
import Main from './Main';
import uiState from './uiState';

export default function MemoExplorer() {
  const tabClassName = 'data-[state=open]:flex min-w-0 w-full lg:w-4/5 ';

  return (
    <Tabs.Root
      orientation="vertical"
      lazyMount
      class="flex h-screen p-4 w-full mx-auto justify-center"
      defaultValue="memos"
      onValueChange={action(() => (uiState.tabVisibility = 'visible'))}
    >
      <Sidebar />
      <Tabs.Content class={tabClassName} value="memos">
        <Main />
      </Tabs.Content>
      <Tabs.Content class={tabClassName} value="stats">
        Stats
      </Tabs.Content>
    </Tabs.Root>
  );
}
