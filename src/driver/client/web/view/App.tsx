import { Tabs } from '@ark-ui/solid/tabs';

import Sidebar from './Sidebar';
import NoteTab from './Note';
import MemoTab from './Memo';
import UIState, { SidebarTabs } from './UIState';

import './index.css';
import { container } from '#domain/shared/infra/singletons';

export default function App() {
  const uiState = container.resolve(UIState);

  return (
    <Tabs.Root
      orientation="vertical"
      lazyMount
      defaultValue={uiState.value?.['app.sidebar']}
      onValueChange={({ value }) => uiState.update({ 'app.sidebar': value as SidebarTabs })}
      class="flex h-screen"
    >
      <Sidebar />
      <NoteTab />
      <MemoTab />
    </Tabs.Root>
  );
}
