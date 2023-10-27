import { useRef } from 'react';
import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { useCreation } from 'ahooks';

import NoteService from 'service/NoteService';
import NoteEditor from 'model/note/Editor';

export default function useDrag() {
  const { moveNotes, noteTree } = container.resolve(NoteService);
  const id = useCreation(() => uniqueId('note-tree-view-'), []);
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id, data: { instance: noteTree.root } });
  const isDraggingNode = useRef(false);

  function reset() {
    noteTree.resetUndroppable();
    isDraggingNode.current = true;
  }

  useDndMonitor({
    onDragStart: ({ active }) => {
      const draggingItem = active.data.current?.instance;

      if (draggingItem instanceof NoteEditor) {
        noteTree.updateInvalidTargetNodes(draggingItem.editable.entityId);
      }

      if (noteTree.hasNode(draggingItem)) {
        isDraggingNode.current = true;
        if (!draggingItem.isSelected) {
          noteTree.toggleSelect(draggingItem.id, { reason: 'drag' });
        }

        noteTree.updateInvalidTargetNodes();
      }
    },
    onDragCancel: () => {
      if (isDraggingNode.current) {
        reset();
      }
    },
    onDragEnd: ({ over, active }) => {
      const dropNode = over?.data.current?.instance;
      const draggingItem = active.data.current?.instance;

      if (noteTree.hasNode(dropNode)) {
        if (
          (noteTree.hasNode(draggingItem) || draggingItem instanceof NoteEditor) &&
          !noteTree.undroppableNodes.includes(dropNode)
        ) {
          const draggingItems = draggingItem instanceof NoteEditor ? [draggingItem.editable.entityId] : undefined;

          moveNotes(dropNode === noteTree.root ? null : dropNode.id, draggingItems);
        }
      }

      if (isDraggingNode.current) {
        reset();
      }
    },
  });

  return { setDroppableRef, isOver };
}
