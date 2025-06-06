import { Tabs } from '@ark-ui/solid/tabs';

import container from '#utils/singletonContainer';
import Sidebar from './Sidebar';
import NoteTab from './Note';
import MaterialFormModal from './Note/MaterialFormModal';
import MemoTab from './Memo';
import UIState, { SidebarTabs } from './UIState';
import './index.css';
import { Show } from 'solid-js';

export default function App() {
  const uiState = container.resolve(UIState);
  const mainTabClassName = 'flex-grow min-w-0 relative bg-gray-50 h-full';

  return (
    <Show when={uiState.isReady}>
      <Tabs.Root
        orientation="vertical"
        lazyMount
        defaultValue={uiState.get('app.sidebar')}
        onValueChange={({ value }) => uiState.set('app.sidebar', value as SidebarTabs)}
        class="flex h-screen"
      >
        <Sidebar />
        <NoteTab className={mainTabClassName} />
        <MemoTab className={mainTabClassName} />
      </Tabs.Root>
      <MaterialFormModal />
    </Show>
  );
}
