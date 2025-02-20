import { Tabs } from '@ark-ui/solid';
import { DatabaseIcon, NotepadTextIcon } from 'lucide-solid';

import { container } from '#domain/shared/infra/singletons';
import UIState, { NoteTreeViewTabs } from '#web/view/uiState';

import NoteTreeView from './NoteTree';
import MaterialTreeView from './MaterialTree';

export default function TreeView() {
  const uiState = container.resolve(UIState);

  return (
    <Tabs.Root
      orientation="horizontal"
      lazyMount
      defaultValue={uiState.value?.['note.treeView']}
      onValueChange={({ value }) => uiState.update({ 'note.treeView': value as NoteTreeViewTabs })}
    >
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
      <Tabs.Content value="note">
        <NoteTreeView />
      </Tabs.Content>
      <Tabs.Content value="material">
        <MaterialTreeView />
      </Tabs.Content>
    </Tabs.Root>
  );
}
