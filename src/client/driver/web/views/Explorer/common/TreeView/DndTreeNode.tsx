import { ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';

import Draggable from '@web/components/dnd/Draggable';
import Droppable from '@web/components/dnd/Droppable';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import type { HierarchyEntity } from '@shared/domain/model/entity';

export interface Props<T extends HierarchyEntity> {
  children: ReactNode;
  node: TreeNode<T>;
  onDrop: (item: unknown, treeNode: TreeNode<T>) => void;
  onDragStart: () => void;
  onDragStop: () => void;
}

// eslint-disable-next-line mobx/missing-observer
export default function DndTreeNode<T extends HierarchyEntity>({
  children,
  node,
  onDrop,
  onDragStart,
  onDragStop,
}: Props<T>) {
  const handleDragStart = () => {
    node.toggleSelect({ value: true });
    onDragStart();
  };

  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    if (isOver && !node.isLeaf) {
      const timer = setTimeout(() => {
        node.toggleExpand({ value: true });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOver, node]);

  return (
    <Droppable
      onOverToggle={setIsOver}
      className={clsx(isOver && !node.isDisabled && 'bg-gray-100')}
      onDrop={(item) => !node.isDisabled && onDrop(item, node)}
    >
      <Draggable noPreview onDragStart={handleDragStart} onDragEnd={onDragStop} item={node}>
        {children}
      </Draggable>
    </Droppable>
  );
}
