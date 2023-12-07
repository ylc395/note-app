import { observer } from 'mobx-react-lite';
import { type MouseEventHandler, useEffect, type MouseEvent } from 'react';
import { CaretDownOutlined, CaretRightFilled } from '@ant-design/icons';
import clsx from 'clsx';
import { uniqueId } from 'lodash-es';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useCreation } from 'ahooks';

import type { HierarchyEntity } from '@shared/domain/model/entity';
import scrollIntoViewIfNeeded from './scrollIntoViewIfNeeded';
import type { TreeNodeProps } from './types';

const INDENT = 25;

// we should use an anonymous component to make <TreeNode> reactive
const TreeNode = observer(function <T extends HierarchyEntity>({ node, level, ...ctx }: TreeNodeProps<T>) {
  const {
    tree,
    nodeClassName,
    titleClassName,
    caretClassName,
    emptyChildrenView,
    loadingIcon,
    draggable,
    droppable,
    multiple,
    onContextmenu,
    renderTitle,
  } = ctx;

  const id = useCreation(() => uniqueId('treeNode'), []);
  const {
    setNodeRef: setDraggableRef,
    listeners,
    attributes,
  } = useDraggable({ id, disabled: !draggable, data: { instance: node } });
  const {
    setNodeRef: setDroppableRef,
    isOver,
    node: domNode,
  } = useDroppable({ id, data: { instance: node }, disabled: !droppable });
  const useLoadingIcon = node.isLoading && loadingIcon;
  const expand: MouseEventHandler = (e) => {
    e.stopPropagation();

    if (useLoadingIcon || node.id === tree.root.id) {
      return;
    }

    tree.toggleExpand(node.id);
  };

  const select: MouseEventHandler = (e) => {
    e.stopPropagation();
    tree.toggleSelect(node.id, { multiple: multiple && (e.metaKey || e.ctrlKey) });
  };

  const handleContextmenu =
    !node.isDisabled && onContextmenu
      ? (e: MouseEvent) => {
          e.stopPropagation();
          !node.isSelected && tree.toggleSelect(node.id, { reason: 'contextmenu' });
          onContextmenu(node.id);
        }
      : undefined;

  useEffect(() => {
    if (node.isSelected) {
      scrollIntoViewIfNeeded(domNode.current!, false);
    }
  }, [node.isSelected, domNode]);

  return (
    <>
      <div
        data-over={isOver}
        data-disabled={node.isDisabled}
        data-selected={node.isSelected}
        style={{ paddingLeft: `${level * INDENT}px` }}
        ref={setDroppableRef}
        onClick={select}
        onContextMenu={handleContextmenu}
        className={nodeClassName}
      >
        <div className={clsx('flex', node.isLeaf && 'pl-4')} ref={setDraggableRef} {...listeners} {...attributes}>
          {!node.isLeaf &&
            (useLoadingIcon ? (
              loadingIcon
            ) : node.isExpanded ? (
              <CaretDownOutlined className={caretClassName} onClick={expand} />
            ) : (
              <CaretRightFilled className={caretClassName} onClick={expand} />
            ))}
          {renderTitle ? renderTitle(node) : <span className={titleClassName}>{node.title}</span>}
        </div>
      </div>
      {node.isExpanded && node.children.length > 0
        ? node.children.map((child) => <TreeNode key={child.id} node={child} level={level + 1} {...ctx} />)
        : emptyChildrenView?.({ indent: (level + 1) * INDENT })}
    </>
  );
});

export default TreeNode;
