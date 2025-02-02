import { TreeView } from '@ark-ui/solid';
import { For, Show } from 'solid-js';

import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';

function Node(props: { note: NoteVO; parent?: TreeNode; indexPath: number[] }) {
  const node = new TreeNode({
    value: props.note,
    parent: props.parent,
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
            <For each={node.childrenQuery.result.data}>
              {(child, index) => <Node parent={node} note={child} indexPath={[...props.indexPath, index()]} />}
            </For>
          </TreeView.BranchContent>
        </TreeView.Branch>
      </Show>
    </TreeView.NodeProvider>
  );
}

export default Node;
