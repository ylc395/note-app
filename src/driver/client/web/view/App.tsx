import { Tabs } from '@ark-ui/solid/tabs';

import { container } from '#domain/shared/infra/singletons';
import Sidebar from './Sidebar';
import NoteTab from './Note';
import MaterialFormModal from './Note/MaterialFormModal';
import MemoTab from './Memo';
import UIState, { SidebarTabs } from './UIState';
import './index.css';

export default function App() {
  const uiState = container.resolve(UIState);
  const mainTabClassName = 'flex-grow min-w-0 relative bg-gray-50 h-full';

  return (
    <>
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
    </>
  );
}
