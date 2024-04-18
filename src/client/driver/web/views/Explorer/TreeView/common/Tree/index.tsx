import { useState, type ReactNode } from 'react';
import { useBoolean } from 'ahooks';
import clsx from 'clsx';

import type TreeModel from '@domain/common/model/abstract/Tree';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import type { HierarchyEntity } from '@shared/domain/model/entity';
import Tree from '@web/components/Tree';

import NodeTitle, { type Props as NodeTitleProps } from './NodeTitle';
import DndTreeNode, { type Props as DndTreeNodeProps } from './DndTreeNode';
import TreeDraggingPreview from './TreeDraggingPreview';
import Menu, { type Props as MenuProps } from '@web/components/Menu';
import type { MenuItem } from '@shared/domain/infra/ui';

interface Props<T extends HierarchyEntity> {
  tree: TreeModel<T>;
  getContextmenuItems: (node: TreeNode<T>) => MenuItem[];
  nodeOperation: (node: TreeNode<T>) => ReactNode;
  onClick: (node: TreeNode<T>, isMultiple: boolean) => void;
  editingNodeId?: string;
  defaultIcon?: NodeTitleProps<T>['defaultIcon'];
  onEditEnd?: NodeTitleProps<T>['onEditEnd'];
  onEditCancel?: NodeTitleProps<T>['onEditCancel'];
  onDrop: DndTreeNodeProps<T>['onDrop'];
  onDragStart: DndTreeNodeProps<T>['onDragStart'];
  onDragStop: DndTreeNodeProps<T>['onDragStop'];
  onContextmenuSelect: MenuProps['onSelect'];
}

// eslint-disable-next-line mobx/missing-observer
export default function TreeView<T extends HierarchyEntity>({
  tree,
  getContextmenuItems,
  onContextmenuSelect,
  editingNodeId,
  onClick,
  onDragStart,
  nodeOperation,
  onDrop,
  onEditCancel,
  onEditEnd,
  onDragStop,
  defaultIcon,
}: Props<T>) {
  const [isContextmenuOpen, { setTrue: openContextmenu, setFalse: closeContextmenu }] = useBoolean(false);
  const [contextmenuItems, setContextmenuItems] = useState<MenuItem[]>();

  function handleClick(node: TreeNode<T>, isMultiple: boolean) {
    node.toggleSelect({ isMultiple });
    onClick?.(node, isMultiple);
  }

  function handleContextmenu(node: TreeNode<T>) {
    node.toggleSelect({ value: true });
    setContextmenuItems(getContextmenuItems(node));
    openContextmenu();
  }

  return (
    <>
      <Tree
        onContextmenu={handleContextmenu}
        onClick={handleClick}
        className="grow overflow-auto pr-2 -mr-2 custom-scrollbar"
        nodeClassName={(node) =>
          clsx(
            'group relative cursor-pointer py-1 rounded-md text-text-secondary text-sm hover:bg-tree-highlight',
            node.isSelected && 'bg-tree-highlight',
            node.isDisabled && 'cursor-not-allowed opacity-60',
          )
        }
        iconClassName="ml-1 w-[10px] h-[10px] opacity-80"
        tree={tree}
        multiple
        renderNode={(node, originalNodeView) => (
          <DndTreeNode node={node} onDrop={onDrop} onDragStart={onDragStart} onDragStop={onDragStop}>
            {originalNodeView}
          </DndTreeNode>
        )}
        renderTitle={(node) => (
          <NodeTitle
            onEditCancel={onEditCancel}
            onEditEnd={onEditEnd}
            isEditing={editingNodeId === node.id}
            defaultIcon={defaultIcon}
            node={node}
          >
            {!node.isDisabled && editingNodeId !== node.id && nodeOperation(node)}
          </NodeTitle>
        )}
      />
      <TreeDraggingPreview />
      <Menu
        native
        items={contextmenuItems || []}
        isOpen={isContextmenuOpen}
        onSelect={onContextmenuSelect}
        onClose={closeContextmenu}
      />
    </>
  );
}
