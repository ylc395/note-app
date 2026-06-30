import type TreeExplorer from '#domain/client/app/model/note/TreeExplorer';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import { normalizeTitle } from '#domain/shared/model/note';
import { Show } from 'solid-js';

export default function DragPreview(props: { treeView: TreeExplorer; node: TreeNode }) {
  const count = props.treeView.treeNodeSets.selected.has(props.node.id) ? props.treeView.treeNodeSets.selected.size : 1;

  return (
    <div class="text-fg-secondary bg-bg-tertiary p-2 text-sm">
      <span classList={{ italic: count > 1 }}>{props.node.value ? normalizeTitle(props.node.value) : ''}</span>
      <Show when={count > 1}>
        <span> 等共 {count} 项</span>
      </Show>
    </div>
  );
}
