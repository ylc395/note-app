import { Tabs } from '@ark-ui/solid';
import { DatabaseIcon, NotepadTextIcon } from 'lucide-solid';

import { container } from '#domain/shared/infra/singletons';
import UIState, { NoteTreeViewTabs } from '#web/view/UIState';

import NoteTreeView from './NoteTree';
import MaterialTreeView from './MaterialTree';
import AddButton from './AddButton';

export default function TreeView() {
  const uiState = container.resolve(UIState);

  return (
    <Tabs.Root
      orientation="horizontal"
      lazyMount
      defaultValue={uiState.get('note.treeView') ?? NoteTreeViewTabs.Note}
      onValueChange={({ value }) => uiState.set('note.treeView', value as NoteTreeViewTabs)}
    >
      <div class="flex items-center justify-between">
        <Tabs.List class="flex">
          <Tabs.Trigger class="flex items-center text-sm" value={NoteTreeViewTabs.Note}>
            <NotepadTextIcon />
            笔记
          </Tabs.Trigger>
          <Tabs.Trigger class="flex items-center text-sm" value={NoteTreeViewTabs.Material}>
            <DatabaseIcon />
            素材
          </Tabs.Trigger>
        </Tabs.List>
        <AddButton />
      </div>
      <Tabs.Content value="note" class="overflow-auto">
        <NoteTreeView />
      </Tabs.Content>
      <Tabs.Content value="material" class="overflow-auto">
        <MaterialTreeView />
      </Tabs.Content>
    </Tabs.Root>
  );
}
