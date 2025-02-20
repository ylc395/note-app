import { createTreeCollection, TreeView } from '@ark-ui/solid';
import { For } from 'solid-js';

import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import type Tree from '#domain/client/shared/model/note/Tree';

import NodeView from './Node';

export default function NoteTree(props: { tree: Tree }) {
  const collection = createTreeCollection<TreeNode>({
    rootNode: props.tree.root,
    nodeToValue: (node) => node.id,
  });

  return (
    <TreeView.Root collection={collection}>
      <TreeView.Tree>
        <For each={collection.rootNode.childrenQuery.result.data}>
          {(note, index) => <NodeView tree={props.tree} note={note} parent={props.tree.root} indexPath={[index()]} />}
        </For>
      </TreeView.Tree>
    </TreeView.Root>
  );
}
