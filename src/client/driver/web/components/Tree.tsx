import { type ReactNode, type MouseEventHandler, useCallback, useContext, createContext, useState } from 'react';
import { CaretRightFilled, CaretDownOutlined } from '@ant-design/icons';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import uniqueId from 'lodash/uniqueId';
import clsx from 'clsx';

import type { Tree, TreeNode } from 'model/abstract/Tree';
import { observer } from 'mobx-react-lite';

interface ITreeContext<T extends TreeNode = TreeNode> {
  titleRender?: (node: T) => ReactNode;
  onContextmenu?: (node: T) => Promise<void> | void;
  onExpand: (node: T) => void;
  onSelect: (node: T, isMultiple: boolean) => void;
  draggable?: boolean;
  multiple?: boolean;
  tree: Tree<T>;
  id: string;
}

export type TreeProps<T extends TreeNode> = Omit<ITreeContext<T>, 'id'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TreeContext = createContext<ITreeContext>(undefined as any);

const TreeNode = observer(function ({ node, level }: { node: TreeNode; level: number }) {
  const { id, multiple, draggable, onExpand, onContextmenu, onSelect, titleRender, tree } = useContext(TreeContext);

  const triggerExpand = useCallback(
    (node: TreeNode) => {
      if (!node.isExpanded && !node.isLoaded) {
        tree.loadChildren(node);
      }

      onExpand(node);
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
        onClick={node.isDisabled ? undefined : (e) => onSelect(node, Boolean(multiple) && e.metaKey)}
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
      {node.isExpanded && node.children.map((child) => <TreeNode key={child.key} node={child} level={level + 1} />)}
    </>
  );
});

TreeNode.displayName = 'TreeNode';

export default observer(function Tree<T extends TreeNode>({ tree, ...props }: TreeProps<T>) {
  const [id] = useState(() => uniqueId('tree-view-'));

  return (
    <TreeContext.Provider value={{ ...props, id, tree } as unknown as ITreeContext}>
      <div>
        {tree.roots.map((node) => (
          <TreeNode key={node.key} node={node} level={0} />
        ))}
      </div>
    </TreeContext.Provider>
  );
});
