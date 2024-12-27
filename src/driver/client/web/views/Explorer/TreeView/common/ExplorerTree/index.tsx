import { useRef, type ReactNode } from 'react';
import { useEventListener, useMount } from 'ahooks';
import clsx from 'clsx';

import Tree from '#web/components/Tree';
import type { HierarchyEntity } from '#domain/client/shared/model/entity';
import type TreeNode from '#domain/client/shared/model/abstract/TreeNode';
import MoveBehavior from '#domain/client/app/model/entity/MoveBehavior';

import NodeTitle, { type Props as NodeTitleProps } from './NodeTitle';
import { container } from '#domain/shared/infra/singletons';
import Explorer from '#domain/client/app/model/abstract/Explorer';
import DndTreeNode from './DndTreeNode';

interface Props<T extends HierarchyEntity> {
  explorer: Explorer<T>;
  renderNodeOperation?: (node: TreeNode<T>) => ReactNode;
  defaultIcon?: NodeTitleProps<T>['defaultIcon'];
  onClick?: (node: TreeNode<T>) => void;
  onContextmenu?: (node: TreeNode<T>) => void;
}

export default function ExplorerTreeView<T extends HierarchyEntity>({
  explorer,
  renderNodeOperation,
  defaultIcon,
  onClick,
  onContextmenu,
}: Props<T>) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const { cancel: finishMoving, start: startMoving, perform: moveTo } = container.resolve(MoveBehavior);
  const { tree, rename, updateScrollInfo } = explorer;

  useEventListener(
    'scroll',
    (e) => updateScrollInfo({ y: (e.target as HTMLElement).scrollTop, x: (e.target as HTMLElement).scrollLeft }),
    { target: divRef },
  );

  useMount(() => {
    if (divRef.current) {
      const { x = 0, y = 0 } = explorer.uiState.value?.scroll || {};
      divRef.current.scrollTo(x, y);
    }
  });

  return (
    <div className="grow scroll-zone">
      <div ref={divRef} className="px-2">
        <Tree
          onClick={onClick}
          onContextmenu={onContextmenu}
          nodeClassName={(node) =>
            clsx(
              'group relative cursor-pointer py-1 rounded-md text-text-secondary text-sm hover:bg-tree-highlight',
              node.isSelected && 'bg-tree-highlight',
              node.isDisabled && 'cursor-not-allowed opacity-60',
            )
          }
          iconClassName="ml-1 w-[10px] h-[10px] opacity-80"
          tree={tree}
          renderNode={(node, originalNodeView) => (
            <div>
              <DndTreeNode
                node={node}
                onDragStart={() => startMoving([node.entityLocator!])}
                onDrop={moveTo}
                onDragStop={finishMoving}
              >
                {originalNodeView}
              </DndTreeNode>
            </div>
          )}
          renderTitle={(node) => (
            <NodeTitle
              onEditCancel={rename.cancel}
              onEditEnd={rename.submit}
              isEditing={rename.editingId === node.id}
              defaultIcon={defaultIcon}
              node={node}
            >
              {!node.isDisabled && rename.editingId !== node.id && renderNodeOperation?.(node)}
            </NodeTitle>
          )}
        />
      </div>
    </div>
  );
}
