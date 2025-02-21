import { Show } from 'solid-js';
import { PlusIcon, FolderPlusIcon } from 'lucide-solid';

import { container } from '#domain/shared/infra/singletons';
import NoteService from '#domain/client/app/service/NoteService';
import UIState, { NoteTreeViewTabs } from '#web/view/UIState';
import { NoteTypes } from '#domain/shared/model/note';

export default function AddButton() {
  const uiState = container.resolve(UIState);
  const { createNote } = container.resolve(NoteService);

  return (
    <div class="flex items-center">
      <Show when={uiState.get('note.treeView') === NoteTreeViewTabs.Note}>
        <button onClick={() => createNote({ type: NoteTypes.Note })}>
          <PlusIcon />
        </button>
      </Show>
      <Show when={uiState.get('note.treeView') === NoteTreeViewTabs.Material}>
        <button>
          <PlusIcon />
        </button>
        <button onClick={() => createNote({ type: NoteTypes.Material })}>
          <FolderPlusIcon />
        </button>
      </Show>
    </div>
  );
}
