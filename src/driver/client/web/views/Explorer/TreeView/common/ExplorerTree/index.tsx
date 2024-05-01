import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useBoolean, useEventListener } from 'ahooks';
import clsx from 'clsx';

import type TreeNode from '@domain/client/common/model/abstract/TreeNode';
import type { HierarchyEntity } from '@domain/shared/model/entity';
import Tree from '@web/components/Tree';

import NodeTitle, { type Props as NodeTitleProps } from './NodeTitle';
import DndTreeNode from './DndTreeNode';
import Menu, { type Props as MenuProps } from '@web/components/Menu';
import { container } from 'tsyringe';
import MoveBehavior from '@domain/client/app/model/behavior/MoveBehavior';
import Explorer from '@domain/client/app/model/abstract/Explorer';

interface Props<T extends HierarchyEntity> {
  explorer: Explorer<T>;
  getContextmenuItems: (node: TreeNode<T>) => MenuProps['items'];
  nodeOperation: (node: TreeNode<T>) => ReactNode;
  onClick: (node: TreeNode<T>, isMultiple: boolean) => void;
  defaultIcon?: NodeTitleProps<T>['defaultIcon'];
}

// eslint-disable-next-line mobx/missing-observer
export default function ExplorerTreeView<T extends HierarchyEntity>({
  getContextmenuItems,
  explorer,
  onClick,
  nodeOperation,
  defaultIcon,
}: Props<T>) {
  const [isContextmenuOpen, { setTrue: openContextmenu, setFalse: closeContextmenu }] = useBoolean(false);
  const [contextmenuItems, setContextmenuItems] = useState<MenuProps['items']>();
  const divRef = useRef<HTMLDivElement | null>(null);
  const { finishMoving, startMoving, moveTo } = container.resolve(MoveBehavior);
  const { tree, rename, persistScrollInfo } = explorer;

  function handleClick(node: TreeNode<T>, isMultiple: boolean) {
    node.toggleSelect({ isMultiple });
    onClick?.(node, isMultiple);
  }

  function handleContextmenu(node: TreeNode<T>) {
    node.toggleSelect({ value: true });
    setContextmenuItems(getContextmenuItems(node));
    openContextmenu();
  }

  useEventListener(
    'scroll',
    (e) => persistScrollInfo({ y: (e.target as HTMLElement).scrollTop, x: (e.target as HTMLElement).scrollLeft }),
    { target: divRef },
  );

  useEffect(() => {
    if (divRef.current) {
      const { x = 0, y = 0 } = explorer.scrollInfo || {};
      divRef.current.scrollTo(x, y);
    }
  }, [explorer]);

  return (
    <div ref={divRef} className="grow overflow-auto pr-2 -mr-2 custom-scrollbar">
      <Tree
        onContextmenu={handleContextmenu}
        onClick={handleClick}
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
          <DndTreeNode
            node={node}
            onDrop={() => moveTo(node.entityLocator)}
            onDragStart={() => startMoving({ mode: 'drag', item: node })}
            onDragStop={finishMoving}
          >
            {originalNodeView}
          </DndTreeNode>
        )}
        renderTitle={(node) => (
          <NodeTitle
            onEditCancel={rename.cancel}
            onEditEnd={rename.submit}
            isEditing={rename.id === node.id}
            defaultIcon={defaultIcon}
            node={node}
          >
            {!node.isDisabled && rename.id !== node.id && nodeOperation(node)}
          </NodeTitle>
        )}
      />
      <Menu native items={contextmenuItems || []} isOpen={isContextmenuOpen} onClose={closeContextmenu} />
    </div>
  );
}
