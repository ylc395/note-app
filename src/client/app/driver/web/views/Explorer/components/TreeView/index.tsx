import type { ReactNode } from 'react';
import type { MainEntityTypes } from 'model/entity';
import type { default as TreeModel, TreeNode } from 'model/abstract/Tree';
import Tree from 'components/Tree';

import SearchInput from './SearchInput';
import NodeTitle from './NodeTitle';

interface Props<T extends { icon: string | null }> {
  entityType?: MainEntityTypes;
  tree: TreeModel<T>;
  nodeOperation?: (node: TreeNode<T>) => ReactNode;
}

export default function TreeView<T extends { icon: string | null }>({ entityType, tree, nodeOperation }: Props<T>) {
  const isNormal = Boolean(entityType);

  return (
    <>
      {isNormal && <SearchInput entityType={entityType!} />}
      <Tree
        draggable={isNormal}
        droppable={isNormal}
        nodeClassName="flex py-1 cursor-pointer data-[selected=true]:bg-slate-200 group relative"
        caretClassName="text-gray-500"
        tree={tree}
        multiple
        renderTitle={(node) => <NodeTitle node={node}>{nodeOperation?.(node)}</NodeTitle>}
      />
    </>
  );
}
