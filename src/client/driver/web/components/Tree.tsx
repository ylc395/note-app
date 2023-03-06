import { type ReactNode, type MouseEventHandler, useCallback, useContext, createContext, useState } from 'react';
import { CaretRightFilled, CaretDownOutlined } from '@ant-design/icons';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import uniqueId from 'lodash/uniqueId';
import clsx from 'clsx';

import type { TreeNode } from 'model/abstract/Tree';
import { observer } from 'mobx-react-lite';

interface TreeNodeProps {
  node: TreeNode;
  level: number;
}

interface ITreeContext {
  titleRender?: (node: TreeNode) => ReactNode;
  loadChildren: (node: TreeNode) => void;
  onContextmenu?: (node: TreeNode) => void;
  onExpand: (node: TreeNode) => void;
  onSelect: (node: TreeNode, isMultiple: boolean) => void;
  draggable?: boolean;
  multiple?: boolean;
  selectedKeys: TreeNode['key'][];
  expandedKeys: TreeNode['key'][];
  loadedKeys: TreeNode['key'][];
  undroppableKeys?: (TreeNode['key'] | null)[];
  id: string;
}

export interface TreeProps extends Omit<ITreeContext, 'id'> {
  treeData: TreeNode[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TreeContext = createContext<ITreeContext>(undefined as any);

const TreeNode = observer(function TreeNode({ node, level }: TreeNodeProps) {
  const {
    id,
    multiple,
    loadedKeys,
    expandedKeys,
    selectedKeys,
    undroppableKeys,
    draggable,
    loadChildren,
    onExpand,
    onContextmenu,
    onSelect,
    titleRender,
  } = useContext(TreeContext);

  const triggerExpand = useCallback(
    (node: TreeNode, isExpanded: boolean) => {
      if (!isExpanded && !loadedKeys.includes(node.key)) {
        loadChildren(node);
      }

      onExpand(node);
    },
    [loadChildren, loadedKeys, onExpand],
  );

  const isExpanded = expandedKeys.includes(node.key);
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
          'bg-blue-300': selectedKeys.includes(node.key),
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

export default observer(function Tree({ treeData, ...props }: TreeProps) {
  const [id] = useState(() => uniqueId('tree-view-'));

  return (
    <TreeContext.Provider value={{ ...props, id }}>
      <div>
        {treeData.map((node) => (
          <TreeNode key={node.key} node={node} level={0} />
        ))}
      </div>
    </TreeContext.Provider>
  );
});
