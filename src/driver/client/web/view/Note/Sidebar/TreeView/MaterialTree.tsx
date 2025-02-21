import { createEffect, on } from 'solid-js';

import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import BaseTreeView from './Tree';
import UIState, { NoteTreeViewTabs, SidebarTabs } from '#web/view/UIState';

export default function MaterialTree() {
  const { materialTreeView } = container.resolve(NoteService);
  const uiState = container.resolve(UIState);

  createEffect(
    on(
      () =>
        uiState.get('app.sidebar') === SidebarTabs.Note && uiState.get('note.treeView') === NoteTreeViewTabs.Material,
      (isActive) => materialTreeView.tree.setActive(isActive),
    ),
  );

  return <BaseTreeView tree={materialTreeView.tree} />;
}
