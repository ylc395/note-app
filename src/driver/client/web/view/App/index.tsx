import { Splitter } from '@ark-ui/solid';
import { Show } from 'solid-js';
import { action } from 'mobx';

import container from '#utils/singletonContainer';
import MainSidebar from './MainSidebar';
import Explorer from './Explorer';
import Workbench from './Workbench';
import CustomIconPicker from './CustomIconPickerModal';
import UIState from './UIState';
import '../design/index.css';

export default function App() {
  const uiState = container.resolve(UIState);
  const workbenchPanelId = 'workbench';
  const explorerPanelId = 'explorer';

  return (
    <Show when={uiState.isReady}>
      <div class="flex h-screen">
        <MainSidebar />
        <Splitter.Root
          onResize={undefined}
          class="grow min-w-0 relative h-full"
          defaultSize={uiState.explorer.proportion}
          panels={[{ id: explorerPanelId, maxSize: 60, minSize: 10 }, { id: workbenchPanelId }]}
          onResizeEnd={action((e) => (uiState.explorer.proportion = e.size))}
        >
          <Explorer panelId={explorerPanelId} />
          <Splitter.ResizeTrigger id={`${explorerPanelId}:${workbenchPanelId}`} class="z-10 w-1 -mr-1 bg-transparent" />
          <Workbench panelId={workbenchPanelId} />
        </Splitter.Root>
      </div>
      <CustomIconPicker />
    </Show>
  );
}
