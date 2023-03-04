import { type ReactNode, type MouseEventHandler, useCallback, useContext, createContext } from 'react';
import { CaretRightFilled, CaretDownOutlined } from '@ant-design/icons';

type TreeNode<T = unknown> = T & {
  key: string;
  title: string;
  children: TreeNode<T>[];
  isLeaf: boolean;
  disabled?: boolean;
};

interface TreeNodeProps<T extends TreeNode> {
  node: T;
  level: number;
}

interface ITreeContext<T extends TreeNode> {
  titleRender?: (node: T) => ReactNode;
  loadChildren: (node: T) => void;
  onContextmenu?: (node: T) => void;
  onExpand: (node: T) => void;
  onSelect: (node: T, isMultiple: boolean) => void;
  draggable?: boolean;
  multiple?: boolean;
  selectedKeys: T['key'][];
  expandedKeys: T['key'][];
  loadedKeys: T['key'][];
}

export interface TreeProps<T extends TreeNode> extends ITreeContext<T> {
  treeData: T[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TreeContext = createContext<ITreeContext<any>>(undefined as any);

function TreeNode<T extends TreeNode>({ node, level }: TreeNodeProps<T>) {
  const context = useContext(TreeContext);
  const {
    multiple,
    loadedKeys,
    expandedKeys,
    selectedKeys,
    loadChildren,
    onExpand,
    onContextmenu,
    onSelect,
    titleRender,
  } = context;

  const triggerExpand = useCallback(
    (node: T, isExpanded: boolean) => {
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

  return (
    <>
      <div
        onClick={node.disabled ? undefined : (e) => onSelect(node, Boolean(multiple) && e.metaKey)}
        onContextMenu={!node.disabled && onContextmenu ? () => onContextmenu(node) : undefined}
        key={node.key}
        style={{ paddingLeft: `${level * 30}px` }}
        className={`flex ${selectedKeys.includes(node.key) ? 'bg-blue-300' : ''} ${node.disabled ? 'bg-gray-100' : ''}`}
      >
        {!node.isLeaf && (isExpanded ? <CaretDownOutlined onClick={expand} /> : <CaretRightFilled onClick={expand} />)}
        {titleRender ? titleRender(node) : node.title}
      </div>
      {isExpanded && node.children.map((child) => <TreeNode key={node.key} node={child} level={level + 1} />)}
    </>
  );
}

export default function Tree<T extends TreeNode>({ treeData, ...props }: TreeProps<T>) {
  return (
    <TreeContext.Provider value={props}>
      <div>
        {treeData.map((node) => (
          <TreeNode key={node.key} node={node} level={0} />
        ))}
      </div>
    </TreeContext.Provider>
  );
}
