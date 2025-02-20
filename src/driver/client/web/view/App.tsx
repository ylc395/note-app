import { Tabs } from '@ark-ui/solid/tabs';

import Sidebar from './Sidebar';
import NoteTab from './Note';
import MemoTab from './Memo';
import UIState, { SidebarTabs } from './uiState';

import './index.css';
import { container } from '#domain/shared/infra/singletons';

export default function App() {
  const tabClassName = 'flex-grow min-w-0 relative bg-gray-50';
  const uiState = container.resolve(UIState);

  return (
    <Tabs.Root
      orientation="vertical"
      lazyMount
      defaultValue={uiState.value?.['app.sidebar']}
      onValueChange={({ value }) => uiState.update({ 'app.sidebar': value as SidebarTabs })}
      class="flex"
    >
      <Sidebar />
      <Tabs.Content class={tabClassName} value={SidebarTabs.Note}>
        <NoteTab />
      </Tabs.Content>
      <Tabs.Content class={tabClassName} value={SidebarTabs.Memo}>
        <MemoTab />
      </Tabs.Content>
    </Tabs.Root>
  );
}
