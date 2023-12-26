import { ReactNode, useState } from 'react';
import clsx from 'clsx';

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
  const handleDragStart = () => {
    node.tree.toggleSelect(node.id, { value: true });
    onDragStart();
  };

  const [isOver, setIsOver] = useState(false);

  return (
    <Droppable
      onOverToggle={setIsOver}
      className={clsx(isOver && !node.isDisabled && 'bg-gray-100')}
      onDrop={(item) => !node.isDisabled && onDrop(item, node)}
    >
      <Draggable noPreview onDragStart={handleDragStart} onDragCancel={onDragStop} onDragEnd={onDragStop} item={node}>
        {children}
      </Draggable>
    </Droppable>
  );
}
