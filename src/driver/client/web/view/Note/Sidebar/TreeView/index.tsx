import { Tabs } from '@ark-ui/solid';
import { Match, Switch } from 'solid-js';

import container from '#utils/singletonContainer';
import UIState, { NoteTreeViewTabs } from '#web/view/UIState';

import NoteTreeView from './NoteTree';
import MaterialTreeView from './MaterialTree';
import MaterialAddButtonGroup from './AddButton/Material';
import NoteAddButton from './AddButton/Note';

export default function TreeView() {
  const uiState = container.resolve(UIState);
  const tabClassName = 'tab font-bold [--tab-p:0px]';
  const tabContentClassName = 'min-h-0 grow';

  return (
    <Tabs.Root
      class="min-h-0 flex flex-col grow"
      orientation="horizontal"
      lazyMount
      unmountOnExit
      defaultValue={uiState.get('note.treeView')}
      onValueChange={({ value }) => uiState.set('note.treeView', value as NoteTreeViewTabs)}
    >
      <div class="flex items-center justify-between text-sm">
        <Tabs.List class="tabs space-x-2">
          <Tabs.Trigger
            class={tabClassName}
            classList={{ 'tab-active': uiState.get('note.treeView') === NoteTreeViewTabs.Note }}
            value={NoteTreeViewTabs.Note}
          >
            普通笔记
          </Tabs.Trigger>
          <Tabs.Trigger
            class={tabClassName}
            classList={{ 'tab-active': uiState.get('note.treeView') === NoteTreeViewTabs.Material }}
            value={NoteTreeViewTabs.Material}
          >
            素材
          </Tabs.Trigger>
        </Tabs.List>
        <div class="flex items-center">
          <Switch>
            <Match when={uiState.get('note.treeView') === NoteTreeViewTabs.Note}>
              <NoteAddButton buttonClassName="btn btn-ghost" />
            </Match>
            <Match when={uiState.get('note.treeView') === NoteTreeViewTabs.Material}>
              <MaterialAddButtonGroup />
            </Match>
          </Switch>
        </div>
      </div>
      <Tabs.Content value={NoteTreeViewTabs.Note} class={tabContentClassName}>
        <NoteTreeView />
      </Tabs.Content>
      <Tabs.Content value={NoteTreeViewTabs.Material} class={tabContentClassName}>
        <MaterialTreeView />
      </Tabs.Content>
    </Tabs.Root>
  );
}
