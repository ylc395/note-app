import type { ReactNode } from 'react';

import type { default as TreeModel, TreeNode } from '@domain/model/abstract/Tree';
import Tree from '@components/Tree';
import type { SearchableEntityType } from '@domain/model/search';
import type { MaterialVO } from '@domain/model/material';
import type { NoteVO } from '@domain/model/note';

import SearchInput from './SearchInput';
import NodeTitle from './NodeTitle';

interface Props<T extends MaterialVO | NoteVO> {
  tree: TreeModel<T>;
  nodeOperation?: (node: TreeNode<T>) => ReactNode;
  entityType?: SearchableEntityType;
}

export default function TreeView<T extends MaterialVO | NoteVO>({ tree, entityType, nodeOperation }: Props<T>) {
  const simple = !entityType;

  return (
    <>
      {entityType && <SearchInput entityType={entityType} />}
      <Tree
        className="scrollbar-stable scrollbar-thin grow overflow-hidden pr-2 hover:overflow-auto"
        draggable={!simple}
        droppable={!simple}
        nodeClassName="[--hover-color:#f3f4f6] [--selected-color:#e2e8f0] 
         hover:bg-[var(--hover-color)]
         data-[selected=true]:bg-[var(--selected-color)]
         data-[disabled=true]:cursor-not-allowed 
         py-1 cursor-pointer group relative"
        caretClassName="text-gray-500"
        tree={tree}
        multiple
        renderTitle={(node) => <NodeTitle node={node}>{nodeOperation?.(node)}</NodeTitle>}
      />
    </>
  );
}
