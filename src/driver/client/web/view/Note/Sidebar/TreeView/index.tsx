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
  const tabClassName = 'data-[selected]:font-bold cursor-pointer';
  const tabContentClassName = 'min-h-0 grow overflow-auto scrollbar-stable scrollbar-thin';
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
      <div class="flex items-center justify-between text-sm mb-stack-s">
        <Tabs.List class="space-x-stack-s">
          <Tabs.Trigger class={tabClassName} value={String(NoteTypes.Document)}>
            文档
          </Tabs.Trigger>
          <Tabs.Trigger class={tabClassName} value={String(NoteTypes.Material)}>
            素材
          </Tabs.Trigger>
        </Tabs.List>
        <div class="flex items-center">
          <Switch>
            <Match when={currentView() === NoteTypes.Document}>
              <NoteAddButton buttonClassName="button button-md button-primary" />
            </Match>
            <Match when={currentView() === NoteTypes.Material}>
              <MaterialAddButtonGroup buttonClassName="button button-md button-primary" />
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
