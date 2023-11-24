import type { ReactNode } from 'react';

import type { HierarchyEntity, MainEntityTypes } from 'model/entity';
import type { default as TreeModel, TreeNode } from 'model/abstract/Tree';
import Tree from 'components/Tree';

import SearchInput from './SearchInput';
import NodeTitle from './NodeTitle';

interface EntityWithIcon extends HierarchyEntity {
  icon: string | null;
}

interface Props<T extends EntityWithIcon> {
  entityType?: MainEntityTypes;
  tree: TreeModel<T>;
  nodeOperation?: (node: TreeNode<T>) => ReactNode;
}

export default function TreeView<T extends EntityWithIcon>({ entityType, tree, nodeOperation }: Props<T>) {
  const isNormal = Boolean(entityType);

  return (
    <>
      {isNormal && <SearchInput entityType={entityType!} />}
      <Tree
        className="scrollbar-stable scrollbar-thin grow overflow-hidden pr-2 hover:overflow-auto"
        draggable={isNormal}
        droppable={isNormal}
        nodeClassName="[--hover-color:#f3f4f6] [--selected-color:#e2e8f0] 
         hover:bg-[var(--hover-color)]
         data-[selected=true]:bg-[var(--selected-color)]
         data-[dragging='not-allowed']:cursor-not-allowed 
         py-1 cursor-pointer group relative"
        caretClassName="text-gray-500"
        tree={tree}
        multiple
        renderTitle={(node) => <NodeTitle node={node}>{nodeOperation?.(node)}</NodeTitle>}
      />
    </>
  );
}
