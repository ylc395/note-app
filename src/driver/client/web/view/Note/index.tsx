import { Splitter, Tabs } from '@ark-ui/solid';
import { container } from '#domain/shared/infra/singletons';

import Sidebar from './Sidebar';
import Workbench from './Workbench';
import UIState, { SidebarTabs } from '../UIState';

export default function NoteTab(props: { className: string }) {
  const uiState = container.resolve(UIState);

  return (
    <Tabs.Content
      value={SidebarTabs.Note}
      asChild={(tabProps) => (
        <Splitter.Root
          {...tabProps()}
          class={props.className}
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
