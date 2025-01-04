import { cloneElement, useEffect, type ReactElement } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import { type EntityLocator, type HierarchyEntity, entityLocatorTypeId } from '#domain/client/shared/model/entity';
import Preview from './Preview';

export interface Props<T extends HierarchyEntity> {
  children: ReactElement;
  node: TreeNode<T>;
  onDrop: (itemToDrop: EntityLocator) => void;
  onDragStart: () => void;
  onDragStop: () => void;
}

export default function DndTreeNode<T extends HierarchyEntity>({
  children,
  node,
  onDrop,
  onDragStart,
  onDragStop,
}: Props<T>) {
  const [{ isDragging }, connectDragSource, connectDragPreview] = useDrag(() => ({
    type: entityLocatorTypeId,
    item: node.entityLocator,
    end: onDragStop,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [{ isOver, canDrop }, connectDropTarget] = useDrop({
    accept: entityLocatorTypeId,
    drop: onDrop,
    canDrop: () => node.isDisabled,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  useEffect(() => {
    if (isOver && !node.isLeaf) {
      const timer = setTimeout(() => {
        node.toggleExpand(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOver, node]);

  useEffect(() => {
    if (isDragging) {
      onDragStart();
    }
  }, [isDragging, onDragStart]);

  return (
    <>
      {connectDropTarget(connectDragSource(cloneElement(children, { 'data-dnd-is-over': isOver && canDrop })))}
      {isDragging && connectDragPreview(<Preview />)}
    </>
  );
}
