import { Tabs } from '@ark-ui/solid/tabs';
import { z } from 'zod';

import UIState from '#domain/client/shared/model/abstract/PersistedObject';

import Sidebar from './Sidebar';
import NoteTab from './Note';
import MemoTab from './Memo';

import './index.css';

export default function App() {
  const state = new UIState('view.sidebar', z.object({ value: z.string() }));
  const tabClassName = 'flex-grow min-w-0 relative bg-gray-50';

  return (
    <Tabs.Root
      orientation="vertical"
      lazyMount
      defaultValue={state.value?.value}
      onValueChange={({ value }) => state.update({ value })}
      class="flex"
    >
      <Sidebar />
      <Tabs.Content class={tabClassName} value="note">
        <NoteTab />
      </Tabs.Content>
      <Tabs.Content class={tabClassName} value="memo">
        <MemoTab />
      </Tabs.Content>
    </Tabs.Root>
  );
}
