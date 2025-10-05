import { Splitter, Tabs } from '@ark-ui/solid';
import { Show } from 'solid-js';

import container from '#utils/singletonContainer';
import MainSidebar from './MainSidebar';
import Explorer from './Explorer';
import Workbench from './Workbench';
import MaterialFormModal from './Note/MaterialFormModal';
import UIState, { SidebarTabs } from './UIState';
import './index.css';

export default function App() {
  const uiState = container.resolve(UIState);
  const workbenchPanelId = 'workbench';
  const explorerPanelId = 'explorer';

  return (
    <Show when={uiState.isReady}>
      <Tabs.Root
        orientation="vertical"
        lazyMount
        defaultValue={uiState.get('app.explorer')}
        onValueChange={({ value }) => uiState.set('app.explorer', value as SidebarTabs)}
        class="flex h-screen"
      >
        <MainSidebar />
        <Splitter.Root
          onResize={undefined}
          class="flex-grow min-w-0 relative h-full"
          defaultSize={uiState.get('app.explorer.proportion')}
          panels={[{ id: explorerPanelId, maxSize: 60, minSize: 10 }, { id: workbenchPanelId }]}
          onResizeEnd={(e) => uiState.set('app.explorer.proportion', e.size)}
        >
          <Explorer panelId={explorerPanelId} />
          <Splitter.ResizeTrigger id={`${explorerPanelId}:${workbenchPanelId}`} class="z-10 w-1 -mr-1 bg-transparent" />
          <Workbench panelId={workbenchPanelId} />
        </Splitter.Root>
      </Tabs.Root>
      <MaterialFormModal />
    </Show>
  );
}
