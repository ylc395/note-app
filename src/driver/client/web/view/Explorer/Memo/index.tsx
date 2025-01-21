import { Tabs } from '@ark-ui/solid';

import Sidebar from './Sidebar';
import Main from './Main';

export default function MemoExplorer() {
  const tabClass = 'max-w-screen-md  w-full lg:w-3/4';
  return (
    <Tabs.Root orientation="vertical" lazyMount class="flex h-screen px-4 mx-auto justify-center" defaultValue="memos">
      <Sidebar />
      <Tabs.Content value="memos" class={tabClass}>
        <Main />
      </Tabs.Content>
      <Tabs.Content value="stats" class={tabClass}>
        Stats
      </Tabs.Content>
    </Tabs.Root>
  );
}
