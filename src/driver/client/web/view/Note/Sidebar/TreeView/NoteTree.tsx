import { createEffect, on } from 'solid-js';

import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import UIState, { NoteTreeViewTabs, SidebarTabs } from '#web/view/UIState';

import BaseTreeView from './Tree';
import NoteAddButton from './AddButton/Note';

export default function NoteTree() {
  const {
    treeViews: { note: noteTreeView },
  } = container.resolve(NoteService);
  const uiState = container.resolve(UIState);

  createEffect(
    on(
      () => uiState.get('app.sidebar') === SidebarTabs.Note && uiState.get('note.treeView') === NoteTreeViewTabs.Note,
      (isActive) => {
        noteTreeView.tree.setActive(isActive);
      },
    ),
  );

  return (
    <BaseTreeView
      operation={(node) => (
        <NoteAddButton
          iconOnly
          noteId={node.id}
          triggerClassName="group-hover:visible invisible absolute right-0 bg-gray-200"
        />
      )}
      treeView={noteTreeView}
    />
  );
}
