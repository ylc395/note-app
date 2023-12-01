import { observer } from 'mobx-react-lite';
import { MouseEventHandler, createContext, useContext } from 'react';
import { CaretDownOutlined, CaretRightFilled } from '@ant-design/icons';
import clsx from 'clsx';
import uniqueId from 'lodash/uniqueId';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useCreation } from 'ahooks';

import type { TreeNode as TreeNodeModel } from '../../model/abstract/Tree';
import type { HierarchyEntity } from '../../../../shared/model/entity';
import type { TreeContext } from './context';

const INDENT = 25;

// we should use an anonymous component to make <TreeNode> reactive
const TreeNode = observer(function <T extends HierarchyEntity>({
  node,
  level,
  ctx,
}: {
  node: TreeNodeModel<T>;
  level: number;
  ctx: ReturnType<typeof createContext<TreeContext<T>>>;
}) {
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
    renderTitle,
  } = useContext(ctx);

  const id = useCreation(() => uniqueId('treeNode'), []);
  const {
    setNodeRef: setDraggableRef,
    listeners,
    attributes,
  } = useDraggable({ id, disabled: !draggable, data: { instance: node } });
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id, data: { instance: node }, disabled: !droppable });
  const useLoadingIcon = node.isLoading && loadingIcon;
  const expand: MouseEventHandler = (e) => {
    e.stopPropagation();

    if (useLoadingIcon || node === tree.root) {
      return;
    }

    tree.toggleExpand(node.id);
  };

  const select: MouseEventHandler = (e) => {
    e.stopPropagation();
    tree.toggleSelect(node === tree.root ? null : node.id, { multiple: multiple && (e.metaKey || e.ctrlKey) });
  };

  return (
    <>
      <div
        data-dragging={!node.isValidTarget ? 'not-allowed' : isOver ? 'over' : undefined}
        data-selected={node.isSelected}
        style={{ paddingLeft: `${level * INDENT}px` }}
        ref={setDroppableRef}
        onClick={select}
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
        ? node.children.map((child) => <TreeNode ctx={ctx} key={child.id} node={child} level={level + 1} />)
        : emptyChildrenView?.({ indent: (level + 1) * INDENT })}
    </>
  );
});

export default TreeNode;
