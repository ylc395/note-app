import { TreeView } from '@ark-ui/solid';
import { createEffect, on, onCleanup, Show } from 'solid-js';

import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import type Tree from '#domain/client/shared/model/note/Tree';
import { Key } from '@solid-primitives/keyed';

function Node(props: { tree: Tree; note: NoteVO; parent: TreeNode; indexPath: number[] }) {
  const node = props.tree.createNode({ value: props.note, parent: props.parent });

  createEffect(
    on(
      () => props.note,
      (note) => node.setValue(note),
    ),
  );

  onCleanup(() => {
    node.destroy();
  });

  return (
    <TreeView.NodeProvider node={node} indexPath={props.indexPath}>
      <Show
        when={node.isLeaf}
        fallback={
          <TreeView.Item>
            <TreeView.ItemText>{normalizeTitle(node.value!)}</TreeView.ItemText>
          </TreeView.Item>
        }
      >
        <TreeView.Branch>
          <TreeView.BranchControl>
            <TreeView.BranchText>{normalizeTitle(node.value!)}</TreeView.BranchText>
          </TreeView.BranchControl>
          <TreeView.BranchContent>
            <Key each={node.childrenQuery.result.data} by="id">
              {(child, index) => (
                <Node tree={props.tree} parent={node} note={child()} indexPath={[...props.indexPath, index()]} />
              )}
            </Key>
          </TreeView.BranchContent>
        </TreeView.Branch>
      </Show>
    </TreeView.NodeProvider>
  );
}

export default Node;
