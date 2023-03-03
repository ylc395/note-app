import { type ReactNode, useCallback, MouseEventHandler } from 'react';
import { CaretRightFilled, CaretDownOutlined } from '@ant-design/icons';

interface TreeNode<T = unknown> {
  key: string;
  title: string;
  children: TreeNode<T>[];
  isLeaf: boolean;
  disabled?: boolean;
}

export interface Props<T extends TreeNode> {
  treeData: T[];
  loadChildren: (node: T) => void;
  multiple?: boolean;
  onSelect: (node: T, isMultiple: boolean) => void;
  onExpand: (node: T) => void;
  onContextmenu?: (node: T) => void;
  titleRender?: (node: T) => ReactNode;
  expandedKeys: T['key'][];
  loadedKeys: T['key'][];
  selectedKeys: T['key'][];
}

export default function Tree<T extends TreeNode>({
  treeData,
  expandedKeys,
  loadedKeys,
  multiple,
  selectedKeys,
  onSelect,
  onExpand,
  onContextmenu,
  titleRender,
  loadChildren,
}: Props<T>) {
  const triggerExpand = useCallback(
    (node: T, isExpanded: boolean) => {
      if (!isExpanded && !loadedKeys.includes(node.key)) {
        loadChildren(node);
      }

      onExpand(node);
    },
    [loadChildren, loadedKeys, onExpand],
  );

  const renderNode = useCallback(
    (node: T, level: number): ReactNode => {
      const isExpanded = expandedKeys.includes(node.key);
      const expand: MouseEventHandler = (e) => {
        e.stopPropagation();
        triggerExpand(node, isExpanded);
      };

      return [
        <div
          onClick={node.disabled ? undefined : (e) => onSelect(node, Boolean(multiple) && e.metaKey)}
          onContextMenu={!node.disabled && onContextmenu ? () => onContextmenu(node) : undefined}
          key={node.key}
          style={{ paddingLeft: `${level * 30}px` }}
          className={`flex ${selectedKeys.includes(node.key) ? 'bg-blue-300' : ''} ${
            node.disabled ? 'bg-gray-100' : ''
          }`}
        >
          {!node.isLeaf &&
            (isExpanded ? <CaretDownOutlined onClick={expand} /> : <CaretRightFilled onClick={expand} />)}
          {titleRender ? titleRender(node) : node.title}
        </div>,
        isExpanded && node.children.map((child) => renderNode(child as T, level + 1)),
      ];
    },
    [expandedKeys, onContextmenu, selectedKeys, titleRender, triggerExpand, onSelect, multiple],
  );

  return <div>{treeData.map((node) => renderNode(node, 0))}</div>;
}
