import { Tabs } from '@ark-ui/solid/tabs';
import { z } from 'zod';

import UIState from '#domain/client/app/model/common/UIState';

import Sidebar from './Sidebar';
import NoteExplorer from './Note';
import MemoExplorer from './Memo';

export default function Explorer() {
  const state = new UIState('view.sidebar', z.object({ value: z.string() }));

  return (
    <Tabs.Root
      orientation="vertical"
      lazyMount
      defaultValue={state.value?.value}
      onValueChange={({ value }) => state.update({ value })}
      class="flex"
    >
      <Sidebar />
      <Tabs.Content value="note">
        <NoteExplorer />
      </Tabs.Content>
      <Tabs.Content class="flex-grow min-w-0 relative bg-gray-50" value="memo">
        <MemoExplorer />
      </Tabs.Content>
    </Tabs.Root>
  );
}
