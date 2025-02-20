import { createEffect, on } from 'solid-js';

import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import UIState, { NoteTreeViewTabs, SidebarTabs } from '#web/view/uiState';

import BaseTreeView from './Tree';

export default function NoteTree() {
  const { noteTreeView } = container.resolve(NoteService);
  const uiState = container.resolve(UIState);

  createEffect(
    on(
      () =>
        uiState.value?.['app.sidebar'] === SidebarTabs.Note && uiState.value['note.treeView'] === NoteTreeViewTabs.Note,
      (isActive) => noteTreeView.tree.setActive(isActive),
    ),
  );

  return <BaseTreeView tree={noteTreeView.tree} />;
}
