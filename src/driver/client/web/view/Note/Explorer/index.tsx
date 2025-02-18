import { Tabs } from '@ark-ui/solid';
import { DatabaseIcon, NotepadTextIcon } from 'lucide-solid';

import NoteTreeView from './NoteTree';
import MaterialTreeView from './MaterialTree';

export default function Explorer() {
  return (
    <div class="border-r">
      <div>
        <h1>NOTE</h1>
      </div>
      <Tabs.Root orientation="horizontal" lazyMount defaultValue="note">
        <Tabs.List class="flex">
          <Tabs.Trigger class="flex items-center text-sm" value="note">
            <NotepadTextIcon />
            笔记
          </Tabs.Trigger>
          <Tabs.Trigger class="flex items-center text-sm" value="material">
            <DatabaseIcon />
            素材
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="note">
          <NoteTreeView />
        </Tabs.Content>
        <Tabs.Content value="material">
          <MaterialTreeView />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
