import { createEffect, on } from 'solid-js';

import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import BaseTreeView from './Tree';
import UIState, { NoteTreeViewTabs, SidebarTabs } from '#web/view/uiState';

export default function MaterialTree() {
  const { materialTreeView } = container.resolve(NoteService);
  const uiState = container.resolve(UIState);

  createEffect(
    on(
      () =>
        uiState.value?.['app.sidebar'] === SidebarTabs.Note &&
        uiState.value['note.treeView'] === NoteTreeViewTabs.Material,
      (isActive) => materialTreeView.tree.setActive(isActive),
    ),
  );

  return <BaseTreeView tree={materialTreeView.tree} />;
}
