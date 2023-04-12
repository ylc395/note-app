import { CaretRightFilled, CaretDownOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { type MouseEventHandler, useCallback, useContext } from 'react';
import clsx from 'clsx';

import type { TreeNode } from 'model/abstract/Tree';
import { TreeContext } from './treeContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TreeNodeView = observer(function ({ node, level }: { node: TreeNode<any>; level: number }) {
  const { id, multiple, draggable, onExpand, onContextmenu, onSelect, titleRender, tree } = useContext(TreeContext);

  const triggerExpand = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: TreeNode<any>) => {
      if (!node.isExpanded && !node.isLoaded) {
        tree.loadChildren(node);
      }

      onExpand?.(node);
    },
    [onExpand, tree],
  );

  const expand: MouseEventHandler = (e) => {
    e.stopPropagation();
    triggerExpand(node);
  };

  const dragId = `${id}-${node.key}`;
  const {
    setNodeRef: setDraggableRef,
    listeners,
    attributes,
  } = useDraggable({ id: dragId, data: { instance: node }, disabled: !draggable });

  const {
    setNodeRef: setDroppableRef,
    isOver,
    active,
  } = useDroppable({
    id: dragId,
    data: { instance: node, noDrop: true },
    disabled: node.isDisabled || !multiple,
  });

  return (
    <>
      <div
        ref={setDroppableRef}
        onClick={node.isDisabled ? undefined : (e) => onSelect?.(node, Boolean(multiple) && e.metaKey)}
        onContextMenu={!node.isDisabled && onContextmenu ? () => onContextmenu(node) : undefined}
        style={{ paddingLeft: `${level * 30}px` }}
        className={clsx('flex', active && node.isUndroppable ? 'cursor-no-drop' : 'cursor-pointer', {
          'bg-blue-300': node.isSelected,
          'bg-gray-100': node.isDisabled,
          'bg-gray-200': isOver,
        })}
      >
        <div className="flex" ref={setDraggableRef} {...listeners} {...attributes}>
          {!node.isLeaf &&
            (node.isExpanded ? <CaretDownOutlined onClick={expand} /> : <CaretRightFilled onClick={expand} />)}
          {titleRender ? titleRender(node) : node.title}
        </div>
      </div>
      {node.isExpanded && node.children.map((child) => <TreeNodeView key={child.key} node={child} level={level + 1} />)}
    </>
  );
});

TreeNodeView.displayName = 'TreeNode';

export default TreeNodeView;
