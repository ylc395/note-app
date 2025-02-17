import { createTreeCollection, TreeView } from '@ark-ui/solid';
import { For } from 'solid-js';

import { container } from '#domain/shared/infra/singletons';
import Explorer from '#domain/client/app/model/note/Explorer';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';

import Node from './Node';

export default function NoteTree() {
  const { tree } = container.resolve(Explorer);
  const collection = createTreeCollection<TreeNode>({
    rootNode: tree.root,
  });

  return (
    <TreeView.Root collection={collection}>
      <TreeView.Tree>
        <For each={collection.rootNode.childrenQuery.result.data}>
          {(note, index) => <Node note={note} indexPath={[index()]} />}
        </For>
      </TreeView.Tree>
    </TreeView.Root>
  );
}
