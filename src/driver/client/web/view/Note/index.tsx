import { Splitter, Tabs } from '@ark-ui/solid';
import container from '#utils/singletonContainer';

import Sidebar from './Sidebar';
import Workbench from './Workbench';
import UIState, { SidebarTabs } from '../UIState';

export default function NoteTab(props: { className: string }) {
  const uiState = container.resolve(UIState);
  const sideBarId = 'sidebar';
  const workbenchId = 'workbench';

  return (
    <Tabs.Content
      class="bg-base-200"
      value={SidebarTabs.Note}
      asChild={(tabProps) => (
        <Splitter.Root
          {...tabProps()}
          onResize={undefined}
          class={props.className}
          defaultSize={uiState.get('note.sidebar.proportion')}
          panels={[{ id: 'sidebar', maxSize: 60 }, { id: 'workbench' }]}
          onResizeEnd={(e) => uiState.set('note.sidebar.proportion', e.size)}
        >
          <Sidebar panelId={sideBarId} />
          <Splitter.ResizeTrigger id={`${sideBarId}:${workbenchId}`} class="w-1" />
          <Workbench panelId={workbenchId} />
        </Splitter.Root>
      )}
    />
  );
}
