import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import uniqueId from 'lodash/uniqueId';
import { container } from 'tsyringe';
import { useCreation } from 'ahooks';

import NoteService from 'service/NoteService';
import NoteEditorView from 'model/note/EditorView';

export default function useDrag() {
  const { moveNotes, noteTree } = container.resolve(NoteService);
  const id = useCreation(() => uniqueId('note-tree-view-'), []);
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id, data: { instance: noteTree.root } });

  useDndMonitor({
    onDragStart: ({ active }) => {
      const draggingItem = active.data.current?.instance;

      if (draggingItem instanceof NoteEditorView) {
        noteTree.updateInvalidTargetNodes(draggingItem.editor.entityId);
      }

      if (noteTree.hasNode(draggingItem)) {
        if (!draggingItem.isSelected) {
          noteTree.toggleSelect(draggingItem.id, { reason: 'drag' });
        }

        noteTree.updateInvalidTargetNodes();
      }
    },
    onDragEnd: ({ over, active }) => {
      const dropNode = over?.data.current?.instance;
      const draggingItem = active.data.current?.instance;

      if (noteTree.hasNode(dropNode)) {
        if (
          (noteTree.hasNode(draggingItem) || draggingItem instanceof NoteEditorView) &&
          !noteTree.undroppableNodes.includes(dropNode)
        ) {
          const draggingItems = draggingItem instanceof NoteEditorView ? [draggingItem.editor.entityId] : undefined;

          moveNotes(dropNode === noteTree.root ? null : dropNode.id, draggingItems);
        }

        noteTree.resetUndroppable();
      }
    },
  });

  return { setDroppableRef, isOver };
}
