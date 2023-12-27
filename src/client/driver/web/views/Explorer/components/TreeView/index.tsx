import type { ReactNode } from 'react';
import clsx from 'clsx';

import type TreeModel from '@domain/common/model/abstract/Tree';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import Tree from '@web/components/Tree';
import type { MaterialVO } from '@shared/domain/model/material';
import type { NoteVO } from '@shared/domain/model/note';

import NodeTitle from './NodeTitle';
import DndTreeNode from './DndTreeNode';
import TreeDraggingPreview from './TreeDraggingPreview';

interface Props<T extends MaterialVO | NoteVO> {
  tree: TreeModel<T>;
  onContextmenu: (node: TreeNode<T>) => void;
  nodeOperation: (node: TreeNode<T>) => ReactNode;
  onClick: (node: TreeNode<T>, isMultiple: boolean) => void;
  onDrop: (item: unknown, node: TreeNode<T>) => void;
  onDragStart: () => void;
  onDragStop: () => void;
}

export default function TreeView<T extends MaterialVO | NoteVO>({
  tree,
  onClick,
  onDragStart,
  onContextmenu,
  nodeOperation,
  onDrop,
  onDragStop,
}: Props<T>) {
  return (
    <>
      <Tree
        onContextmenu={onContextmenu}
        onClick={onClick}
        className="scrollbar-stable scrollbar-thin grow overflow-hidden pr-2 hover:overflow-auto"
        nodeClassName={(node) =>
          clsx(
            'py-1 cursor-pointer',
            node.isSelected && 'bg-gray-100',
            node.isDisabled && 'opacity-60 cursor-not-allowed',
          )
        }
        caretClassName="text-gray-500"
        tree={tree}
        multiple
        renderNode={(node, originalNodeView) => (
          <DndTreeNode<T>
            node={node}
            onDrop={onDrop as (item: unknown, node: TreeNode<MaterialVO | NoteVO>) => void}
            onDragStart={onDragStart}
            onDragStop={onDragStop}
          >
            {originalNodeView}
          </DndTreeNode>
        )}
        renderTitle={(node) => <NodeTitle node={node}>{nodeOperation(node)}</NodeTitle>}
      />
      <TreeDraggingPreview />
    </>
  );
}