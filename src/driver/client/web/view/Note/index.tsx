import { Splitter, Tabs } from '@ark-ui/solid';
import { container } from '#domain/shared/infra/singletons';

import Sidebar from './Sidebar';
import Workbench from './Workbench';
import UIState, { SidebarTabs } from '../UIState';
import { mainTab } from '../classNames';

export default function NoteTab() {
  const uiState = container.resolve(UIState);

  return (
    <Tabs.Content
      value={SidebarTabs.Note}
      asChild={(props) => (
        <Splitter.Root
          {...props()}
          class={mainTab}
          defaultSize={
            (uiState.get('note.sidebar.proportion') as Splitter.RootProps['defaultSize']) ?? [
              { id: 'sidebar', size: 20, maxSize: 60 },
              { id: 'workbench', size: 80 },
            ]
          }
          onSizeChangeEnd={(e) => uiState.set('note.sidebar.proportion', e.size)}
        >
          <Sidebar />
          <Splitter.ResizeTrigger id="sidebar:workbench" class="w-1" />
          <Workbench />
        </Splitter.Root>
      )}
    />
  );
}
