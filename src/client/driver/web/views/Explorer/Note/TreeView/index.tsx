import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useEffect, useState } from 'react';
import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import clsx from 'clsx';
import uniqueId from 'lodash/uniqueId';

import NoteService from 'service/NoteService';
import NoteEditor from 'model/note/Editor';
import NoteTree, { type NoteTreeNode } from 'model/note/Tree';

import Tree, { type TreeProps } from 'web/components/Tree';
import NodeTitle from './NodeTitle';

export default observer(function ExplorerNoteTree({ nodes }: { nodes?: NoteTreeNode[] }) {
  const { selectNote, moveNotes, actByContextmenu } = container.resolve(NoteService);
  const [noteTree] = useState(() => {
    const { noteTree: _noteTree } = container.resolve(NoteService);

    if (nodes) {
      const tree = new NoteTree({ roots: nodes });

      tree.expandedNodes = _noteTree.expandedNodes;
      return tree;
    }

    return _noteTree;
  });

  const handleExpand = useCallback<TreeProps<NoteTreeNode>['onExpand']>(
    ({ key }) => noteTree.toggleExpand(key, false),
    [noteTree],
  );
  const titleRender = useCallback<NonNullable<TreeProps<NoteTreeNode>['titleRender']>>(
    (node) => <NodeTitle node={node} />,
    [],
  );

  const [id] = useState(() => uniqueId('note-tree-view-'));
  const { setNodeRef, isOver } = useDroppable({ id });

  useEffect(() => {
    noteTree.loadChildren();
  }, [nodes, noteTree]);

  useDndMonitor(
    nodes
      ? {}
      : {
          onDragStart: ({ active }) => {
            const draggingItem = active.data.current?.instance;

            if (draggingItem instanceof NoteEditor) {
              noteTree.updateInvalidParentNodes(draggingItem.entityId);
            }

            if (noteTree.has(draggingItem)) {
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
              (noteTree.has(dropNode) || over?.id === id) &&
              (noteTree.has(draggingItem) || draggingItem instanceof NoteEditor)
            ) {
              const draggingItems =
                draggingItem instanceof NoteEditor
                  ? [draggingItem.entityId]
                  : Array.from(noteTree.selectedNodes).map(({ key }) => key);
              const dropNodeKey = noteTree.has(dropNode) ? dropNode.key : null;

              if (!noteTree.invalidParentKeys.has(dropNodeKey)) {
                moveNotes(draggingItems, dropNodeKey);
              }
            }
          },
        },
  );

  const treeView = (
    <Tree
      multiple
      draggable
      tree={noteTree}
      onContextmenu={actByContextmenu}
      titleRender={titleRender}
      onSelect={selectNote}
      onExpand={handleExpand}
    />
  );

  if (nodes) {
    return treeView;
  }

  return (
    <div
      className={clsx('h-full', {
        'cursor-pointer bg-blue-50': isOver && !noteTree.invalidParentKeys.has(null),
        'cursor-no-drop': isOver && noteTree.invalidParentKeys.has(null),
      })}
      ref={setNodeRef}
    >
      {treeView}
    </div>
  );
});
