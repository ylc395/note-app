import type TreeView from '#domain/client/app/model/note/TreeView';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import { normalizeTitle } from '#domain/shared/model/note';
import { Show } from 'solid-js';

export default function DragPreview(props: { treeView: TreeView; node: TreeNode }) {
  const count = props.treeView.tree.selectedNodeIds.has(props.node.id) ? props.treeView.tree.selectedNodeIds.size : 1;

  return (
    <div class="text-text-secondary bg-surface-tertiary p-inset-square-md text-sm">
      <span classList={{ italic: count > 1 }}>{props.node.value ? normalizeTitle(props.node.value) : ''}</span>
      <Show when={count > 1}>
        <span> 等共 {count} 项</span>
      </Show>
    </div>
  );
}
