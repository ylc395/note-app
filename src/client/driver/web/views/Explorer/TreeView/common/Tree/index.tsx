import type { ReactNode } from 'react';
import clsx from 'clsx';

import type TreeModel from '@domain/common/model/abstract/Tree';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import type { HierarchyEntity } from '@shared/domain/model/entity';
import Tree from '@web/components/Tree';

import NodeTitle, { type Props as NodeTitleProps } from './NodeTitle';
import DndTreeNode, { type Props as DndTreeNodeProps } from './DndTreeNode';
import TreeDraggingPreview from './TreeDraggingPreview';

interface Props<T extends HierarchyEntity> {
  tree: TreeModel<T>;
  onContextmenu: (node: TreeNode<T>) => void;
  nodeOperation: (node: TreeNode<T>) => ReactNode;
  onClick: (node: TreeNode<T>, isMultiple: boolean) => void;
  editingNodeId?: string;
  defaultIcon?: NodeTitleProps<T>['defaultIcon'];
  onEditEnd?: NodeTitleProps<T>['onEditEnd'];
  onEditCancel?: NodeTitleProps<T>['onEditCancel'];
  onDrop: DndTreeNodeProps<T>['onDrop'];
  onDragStart: DndTreeNodeProps<T>['onDragStart'];
  onDragStop: DndTreeNodeProps<T>['onDragStop'];
}

// eslint-disable-next-line mobx/missing-observer
export default function TreeView<T extends HierarchyEntity>({
  tree,
  editingNodeId,
  onClick,
  onDragStart,
  onContextmenu,
  nodeOperation,
  onDrop,
  onEditCancel,
  onEditEnd,
  onDragStop,
  defaultIcon,
}: Props<T>) {
  function handleClick(node: TreeNode<T>, isMultiple: boolean) {
    node.toggleSelect({ isMultiple });
    onClick?.(node, isMultiple);
  }

  function handleContextmenu(node: TreeNode<T>) {
    node.toggleSelect({ value: true });
    onContextmenu?.(node);
  }

  return (
    <>
      <Tree
        onContextmenu={handleContextmenu}
        onClick={handleClick}
        className="grow overflow-auto pr-2 -mr-2 custom-scrollbar"
        nodeClassName={(node) =>
          clsx(
            'group relative cursor-pointer py-1 rounded-md text-common-secondary text-sm hover:bg-common-secondary-highlight',
            node.isSelected && 'bg-common-secondary-highlight',
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
    </>
  );
}
