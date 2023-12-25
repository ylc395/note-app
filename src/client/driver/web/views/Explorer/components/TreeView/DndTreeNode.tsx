import { ReactNode } from 'react';
import { useMemoizedFn } from 'ahooks';

import Draggable from '@web/components/dnd/Draggable';
import Droppable from '@web/components/dnd/Droppable';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import { NoteVO } from '@shared/domain/model/note';
import { MaterialVO } from '@shared/domain/model/material';

interface Props<T extends NoteVO | MaterialVO> {
  children: ReactNode;
  node: TreeNode<T>;
  onDrop: (item: unknown, treeNode: TreeNode<T>) => void;
  onDragStart: () => void;
  onDragStop: () => void;
}

export default function DndTreeNode<T>({
  children,
  node,
  onDrop,
  onDragStart,
  onDragStop,
}: Props<NoteVO | MaterialVO>) {
  return (
    <Droppable onDrop={useMemoizedFn((item) => onDrop(item, node))}>
      <Draggable onDragStart={onDragStart} onDragCancel={onDragStop} onDragEnd={onDragStop} item={node}>
        {children}
      </Draggable>
    </Droppable>
  );
}
