import { Tabs } from '@ark-ui/solid';
import { action } from 'mobx';

import Sidebar from './Sidebar';
import Main from './Main/Browser';
import uiState from './uiState';

export default function MemoExplorer() {
  const tabClassName = 'data-[state=open]:flex max-w-screen-md min-w-0 w-full lg:w-3/4 lg:max-w-screen-lg xl:w-4/5';

  return (
    <Tabs.Root
      orientation="vertical"
      lazyMount
      class="flex h-screen px-4 mx-auto justify-center"
      defaultValue="memos"
      onValueChange={action(() => (uiState.isMenuVisible = 'visible'))}
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
