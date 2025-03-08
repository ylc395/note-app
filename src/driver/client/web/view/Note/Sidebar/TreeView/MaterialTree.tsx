import { createEffect, on } from 'solid-js';

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
      operation={(note) => <MaterialAddButton iconOnly noteId={note.id} />}
      treeView={materialTreeView}
      useNewNoteEditor
    />
  );
}
