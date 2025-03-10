import { createEffect, on } from 'solid-js';
import { FolderIcon, FolderOpenIcon } from 'lucide-solid';

import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import UIState, { NoteTreeViewTabs, SidebarTabs } from '#web/view/UIState';

import BaseTreeView from './Tree';
import MaterialAddButton from './AddButton/Material';

export default function MaterialTree() {
  const {
    treeViews: { material: materialTreeView },
  } = container.resolve(NoteService);

  const uiState = container.resolve(UIState);

  createEffect(
    on(
      () =>
        uiState.get('app.sidebar') === SidebarTabs.Note && uiState.get('note.treeView') === NoteTreeViewTabs.Material,
      (isActive) => materialTreeView.tree.setActive(isActive),
    ),
  );

  return (
    <BaseTreeView
      operation={(node) => (
        <MaterialAddButton
          triggerClassName="group-hover:visible invisible absolute right-0 bg-gray-200"
          iconOnly
          noteId={node.id}
        />
      )}
      treeView={materialTreeView}
      useNewNoteEditor
      icon={(node) =>
        node.value?.mimeType ? null : node.isExpanded ? (
          <FolderOpenIcon class="mr-1 shrink-0" />
        ) : (
          <FolderIcon class="mr-1 shrink-0" />
        )
      }
    />
  );
}
