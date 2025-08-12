import { Tabs } from '@ark-ui/solid/tabs';
import { Show } from 'solid-js';

import container from '#utils/singletonContainer';
import MainSidebar from './MainSidebar';
import NoteTab from './Note';
import MaterialFormModal from './Note/MaterialFormModal';
import MemoTab from './Memo';
import UIState, { SidebarTabs } from './UIState';
import './index.css';

export default function App() {
  const uiState = container.resolve(UIState);
  const mainTabClassName = 'flex-grow min-w-0 relative h-full';

  return (
    <Show when={uiState.isReady}>
      <Tabs.Root
        orientation="vertical"
        lazyMount
        defaultValue={uiState.get('app.sidebar')}
        onValueChange={({ value }) => uiState.set('app.sidebar', value as SidebarTabs)}
        class="flex h-screen"
      >
        <MainSidebar />
        <NoteTab className={mainTabClassName} />
        <MemoTab className={mainTabClassName} />
      </Tabs.Root>
      <MaterialFormModal />
    </Show>
  );
}
