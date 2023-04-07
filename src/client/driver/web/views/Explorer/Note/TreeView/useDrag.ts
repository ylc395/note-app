import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { useCreation } from 'ahooks';

import NoteEditor from 'model/note/Editor';
import NoteService from 'service/NoteService';
import type NoteTree from 'model/note/Tree';

export default function useDrag(tree: NoteTree) {
  const { moveNotes, noteTree } = container.resolve(NoteService);
  const id = useCreation(() => uniqueId('note-tree-view-'), []);
  const { setNodeRef, isOver } = useDroppable({ id });

  useDndMonitor(
    tree === noteTree
      ? {
          onDragStart: ({ active }) => {
            const draggingItem = active.data.current?.instance;

            if (draggingItem instanceof NoteEditor) {
              noteTree.updateInvalidParentNodes(draggingItem.entityId);
            }

            if (noteTree.hasNode(draggingItem)) {
              if (!draggingItem.isSelected) {
                noteTree.toggleSelect(draggingItem.key, true);
              }

              noteTree.updateInvalidParentNodes();
            }
          },
          onDragEnd: ({ over, active }) => {
            const dropNode = over?.data.current?.instance;
            const draggingItem = active.data.current?.instance;

            if (
              (noteTree.hasNode(dropNode) || over?.id === id) &&
              (noteTree.hasNode(draggingItem) || draggingItem instanceof NoteEditor)
            ) {
              const draggingItems =
                draggingItem instanceof NoteEditor
                  ? [draggingItem.entityId]
                  : Array.from(noteTree.selectedNodes).map(({ key }) => key);
              const dropNodeKey = noteTree.hasNode(dropNode) ? dropNode.key : null;

              if (!noteTree.invalidParentKeys.has(dropNodeKey)) {
                moveNotes(draggingItems, dropNodeKey);
              }
            }
          },
        }
      : {},
  );

  return { setNodeRef, isOver };
}
