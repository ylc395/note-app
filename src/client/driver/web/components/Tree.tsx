import { type ReactNode, type MouseEventHandler, useCallback, useContext, createContext, useState } from 'react';
import { CaretRightFilled, CaretDownOutlined } from '@ant-design/icons';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import uniqueId from 'lodash/uniqueId';
import clsx from 'clsx';

import type { Tree, TreeNode } from 'model/abstract/Tree';
import { observer } from 'mobx-react-lite';

interface TreeNodeProps {
  node: TreeNode;
  level: number;
}

interface ITreeContext {
  titleRender?: (node: TreeNode) => ReactNode;
  onContextmenu?: (node: TreeNode) => void;
  onExpand: (node: TreeNode) => void;
  onSelect: (node: TreeNode, isMultiple: boolean) => void;
  draggable?: boolean;
  multiple?: boolean;
  undroppableKeys?: (TreeNode['key'] | null)[];
  tree: Tree;
  id: string;
}

export type TreeProps = Omit<ITreeContext, 'id'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TreeContext = createContext<ITreeContext>(undefined as any);

const TreeNode = observer(function ({ node, level }: TreeNodeProps) {
  const { id, multiple, undroppableKeys, draggable, onExpand, onContextmenu, onSelect, titleRender, tree } =
    useContext(TreeContext);

  const triggerExpand = useCallback(
    (node: TreeNode, isExpanded: boolean) => {
      if (!isExpanded && !tree.loadedKeys.has(node.key)) {
        tree.loadChildren(node.key);
      }

      onExpand(node);
    },
    [onExpand, tree],
  );

  const isExpanded = tree.expandedKeys.has(node.key);
  const expand: MouseEventHandler = (e) => {
    e.stopPropagation();
    triggerExpand(node, isExpanded);
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
    disabled: node.disabled || !multiple,
  });

  return (
    <>
      <div
        ref={setDroppableRef}
        onClick={node.disabled ? undefined : (e) => onSelect(node, Boolean(multiple) && e.metaKey)}
        onContextMenu={!node.disabled && onContextmenu ? () => onContextmenu(node) : undefined}
        style={{ paddingLeft: `${level * 30}px` }}
        className={clsx('flex', active && undroppableKeys?.includes(node.key) ? 'cursor-no-drop' : 'cursor-pointer', {
          'bg-blue-300': tree.selectedKeys.has(node.key),
          'bg-gray-100': node.disabled,
          'bg-gray-200': isOver,
        })}
      >
        <div className="flex" ref={setDraggableRef} {...listeners} {...attributes}>
          {!node.isLeaf &&
            (isExpanded ? <CaretDownOutlined onClick={expand} /> : <CaretRightFilled onClick={expand} />)}
          {titleRender ? titleRender(node) : node.title}
        </div>
      </div>
      {isExpanded && node.children.map((child) => <TreeNode key={child.key} node={child} level={level + 1} />)}
    </>
  );
});

TreeNode.displayName = 'TreeNode';

export default observer(function Tree({ tree, ...props }: TreeProps) {
  const [id] = useState(() => uniqueId('tree-view-'));

  return (
    <TreeContext.Provider value={{ ...props, id, tree }}>
      <div>
        {tree.roots.map((node) => (
          <TreeNode key={node.key} node={node} level={0} />
        ))}
      </div>
    </TreeContext.Provider>
  );
});
