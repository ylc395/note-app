import { Tabs } from '@ark-ui/solid';
import { Show } from 'solid-js';

import container from '#utils/singletonContainer';
import UIState, { NoteTreeViewTabs } from '#web/view/UIState';

import NoteTreeView from './NoteTree';
import MaterialTreeView from './MaterialTree';
import MaterialAddButtonGroup from './AddButton/Material';
import NoteAddButton from './AddButton/Note';

export default function TreeView() {
  const uiState = container.resolve(UIState);

  return (
    <Tabs.Root
      class="min-h-0 flex flex-col"
      orientation="horizontal"
      lazyMount
      unmountOnExit
      defaultValue={uiState.get('note.treeView')}
      onValueChange={({ value }) => uiState.set('note.treeView', value as NoteTreeViewTabs)}
    >
      <div class="flex items-center justify-between text-sm">
        <Tabs.List class="flex space-x-1">
          <Tabs.Trigger
            class="flex items-center"
            classList={{ 'font-bold': uiState.get('note.treeView') === NoteTreeViewTabs.Note }}
            value={NoteTreeViewTabs.Note}
          >
            笔记
          </Tabs.Trigger>
          <Tabs.Trigger
            class="flex items-center "
            classList={{ 'font-bold': uiState.get('note.treeView') === NoteTreeViewTabs.Material }}
            value={NoteTreeViewTabs.Material}
          >
            素材
          </Tabs.Trigger>
        </Tabs.List>
        <div class="flex items-center">
          <Show when={uiState.get('note.treeView') === NoteTreeViewTabs.Note}>
            <NoteAddButton />
          </Show>
          <Show when={uiState.get('note.treeView') === NoteTreeViewTabs.Material}>
            <MaterialAddButtonGroup />
          </Show>
        </div>
      </div>
      <Tabs.Content value={NoteTreeViewTabs.Note} class="overflow-auto">
        <NoteTreeView />
      </Tabs.Content>
      <Tabs.Content value={NoteTreeViewTabs.Material} class="overflow-auto">
        <MaterialTreeView />
      </Tabs.Content>
    </Tabs.Root>
  );
}
