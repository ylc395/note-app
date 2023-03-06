import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import clsx from 'clsx';
import uniqueId from 'lodash/uniqueId';

import NoteService from 'service/NoteService';
import NoteEditor from 'model/note/Editor';
import type { NoteTreeNode } from 'model/note/Tree';

import Tree, { type TreeProps } from 'web/components/Tree';
import NodeTitle from './NodeTitle';

export default observer(function ExplorerNoteTree({ node }: { node?: NoteTreeNode }) {
  const { noteTree, selectNote, moveNotes, actByContextmenu } = container.resolve(NoteService);
  const [draggingNode, setDraggingNode] = useState<NoteTreeNode['key']>();
  const invalidParentKeys = useMemo(
    () => (draggingNode ? noteTree.getInvalidParents(draggingNode) : undefined),
    [draggingNode, noteTree],
  );
  const handleExpand = useCallback<TreeProps['onExpand']>(({ key }) => noteTree.toggleExpand(key, false), [noteTree]);

  const handleContextmenu = useCallback<NonNullable<TreeProps['onContextmenu']>>(
    ({ key }) => actByContextmenu(key),
    [actByContextmenu],
  );

  const loadChildren = useCallback<TreeProps['loadChildren']>(({ key }) => noteTree.loadChildren(key), [noteTree]);

  const titleRender = useCallback<NonNullable<TreeProps['titleRender']>>(
    (node) => <NodeTitle node={node as NoteTreeNode} />,
    [],
  );

  const handleSelect = useCallback<TreeProps['onSelect']>(
    (node, isMultiple) => selectNote(node.key, isMultiple),
    [selectNote],
  );

  const [id] = useState(() => uniqueId('note-tree-view-'));
  const { setNodeRef, isOver } = useDroppable({ id });

  useEffect(() => {
    noteTree.loadChildren();
  }, [noteTree]);

  useDndMonitor(
    node
      ? {}
      : {
          onDragStart: ({ active }) => {
            const draggingItem = active.data.current?.instance;

            if (draggingItem instanceof NoteEditor) {
              setDraggingNode(draggingItem.entityId);
            }

            if (noteTree.has(draggingItem)) {
              noteTree.toggleSelect(draggingItem.key, true);
              setDraggingNode(Array.from(noteTree.selectedNodes)[0]);
            }
          },
          onDragEnd: ({ over, active }) => {
            const dropNode = over?.data.current?.instance;
            const draggingItem = active.data.current?.instance;

            if (
              (noteTree.has(dropNode) || over?.id === id) &&
              (noteTree.has(draggingItem) || draggingItem instanceof NoteEditor)
            ) {
              const dropId = noteTree.has(dropNode) ? dropNode.key : null;

              if (!invalidParentKeys?.includes(dropId)) {
                const draggingId = draggingItem instanceof NoteEditor ? draggingItem.entityId : draggingItem.key;
                moveNotes([draggingId], noteTree.has(dropNode) ? dropNode.key : null);
              }
            }
          },
        },
  );

  return (
    <div
      className={clsx('h-full', {
        'bg-blue-50': isOver,
        'cursor-no-drop': isOver && invalidParentKeys?.includes(null),
      })}
      ref={setNodeRef}
    >
      <Tree
        multiple
        draggable
        loadedKeys={Array.from(noteTree.loadedNodes)}
        treeData={node ? [node] : noteTree.roots}
        expandedKeys={Array.from(noteTree.expandedNodes)}
        selectedKeys={Array.from(noteTree.selectedNodes)}
        loadChildren={loadChildren}
        onContextmenu={handleContextmenu}
        titleRender={titleRender}
        onSelect={handleSelect}
        onExpand={handleExpand}
        undroppableKeys={invalidParentKeys}
      />
    </div>
  );
});
