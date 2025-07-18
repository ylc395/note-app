import { Tabs } from '@ark-ui/solid';
import { createMemo, Match, Switch } from 'solid-js';

import container from '#utils/singletonContainer';
import { NoteTypes } from '#domain/shared/model/note';
import UIState from '#web/view/UIState';

import NoteTreeView from './NoteTree';
import MaterialTreeView from './MaterialTree';
import MaterialAddButtonGroup from './AddButton/Material';
import NoteAddButton from './AddButton/Note';

export default function TreeView() {
  const uiState = container.resolve(UIState);
  const tabClassName = 'tab font-bold';
  const tabContentClassName = 'min-h-0 grow';
  const currentView = createMemo(() => uiState.get('note.treeView'));

  return (
    <Tabs.Root
      class="min-h-0 flex flex-col grow"
      orientation="horizontal"
      lazyMount
      unmountOnExit
      defaultValue={String(currentView())}
      onValueChange={({ value }) => uiState.set('note.treeView', Number(value) as NoteTypes)}
    >
      <div class="flex items-center justify-between text-sm">
        <Tabs.List class="tabs space-x-2 [--tab-p:0px]">
          <Tabs.Trigger
            class={tabClassName}
            classList={{ 'tab-active': currentView() === NoteTypes.Document }}
            value={String(NoteTypes.Document)}
          >
            文档
          </Tabs.Trigger>
          <Tabs.Trigger
            class={tabClassName}
            classList={{ 'tab-active': currentView() === NoteTypes.Material }}
            value={String(NoteTypes.Material)}
          >
            素材
          </Tabs.Trigger>
        </Tabs.List>
        <div class="flex items-center">
          <Switch>
            <Match when={currentView() === NoteTypes.Document}>
              <NoteAddButton buttonClassName="btn btn-ghost btn-sm" />
            </Match>
            <Match when={currentView() === NoteTypes.Material}>
              <MaterialAddButtonGroup buttonClassName="btn btn-ghost btn-sm" />
            </Match>
          </Switch>
        </div>
      </div>
      <Tabs.Content value={String(NoteTypes.Document)} class={tabContentClassName}>
        <NoteTreeView />
      </Tabs.Content>
      <Tabs.Content value={String(NoteTypes.Material)} class={tabContentClassName}>
        <MaterialTreeView />
      </Tabs.Content>
    </Tabs.Root>
  );
}
