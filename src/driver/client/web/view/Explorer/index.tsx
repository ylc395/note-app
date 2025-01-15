import { Tabs } from '@ark-ui/solid/tabs';
import { z } from 'zod';

import UIState from '#domain/client/app/model/common/UIState';

import Sidebar from './Sidebar';
import NoteTree from './NoteTree';
import MemoList from './Memo';

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
        <NoteTree />
      </Tabs.Content>
      <Tabs.Content class="flex-grow min-w-0" value="memo">
        <MemoList />
      </Tabs.Content>
    </Tabs.Root>
  );
}
