import { Show } from 'solid-js';
import { PlusIcon } from 'lucide-solid';

import { container } from '#domain/shared/infra/singletons';
import NoteService from '#domain/client/app/service/NoteService';
import UIState, { NoteTreeViewTabs } from '#web/view/UIState';
import { NoteTypes } from '#domain/shared/model/note';

import ButtonGroup from './ButtonGroup';

export default function AddButton() {
  const uiState = container.resolve(UIState);
  const { createNote } = container.resolve(NoteService);

  return (
    <div class="flex items-center">
      <Show when={uiState.get('note.treeView') === NoteTreeViewTabs.Note}>
        <button class="flex" onClick={() => createNote({ type: NoteTypes.Note })}>
          <PlusIcon />
          新建
        </button>
      </Show>
      <Show when={uiState.get('note.treeView') === NoteTreeViewTabs.Material}>
        <ButtonGroup />
      </Show>
    </div>
  );
}
