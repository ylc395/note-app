import { container } from 'tsyringe';
import { DragOverlay, useDndContext } from '@dnd-kit/core';
import { useMemo } from 'react';

import Editor from 'model/abstract/Editor';
import NoteService from 'service/NoteService';

import TabItem from '../Workbench/TabBar/TabItem';
import NoteTree from '../Explorer/Note/TreeView/DraggingTreeView';

// eslint-disable-next-line mobx/missing-observer
export default function DragPreview() {
  const { active } = useDndContext();
  const { noteTree } = container.resolve(NoteService);
  const draggingItem = active?.data.current?.instance;

  const previewTree = useMemo(
    () => (noteTree.hasNode(draggingItem) ? noteTree.fromSelected() : undefined),
    [draggingItem, noteTree],
  );

  return (
    <DragOverlay className="pointer-events-none" dropAnimation={null}>
      {draggingItem instanceof Editor && <TabItem editor={draggingItem}></TabItem>}
      {previewTree && <NoteTree tree={previewTree} />}
    </DragOverlay>
  );
}
