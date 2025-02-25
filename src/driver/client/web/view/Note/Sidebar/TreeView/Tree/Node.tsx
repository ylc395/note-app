import { TreeView } from '@ark-ui/solid';
import { createEffect, createMemo, on, onCleanup, Show } from 'solid-js';
import { Key } from '@solid-primitives/keyed';

import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import TreeViewModel from '#domain/client/app/model/note/TreeView';

import TitleEditor from './TitleEditor';

function Node(props: { treeView: TreeViewModel; note: NoteVO; parent: TreeNode; indexPath: number[] }) {
  const node = props.treeView.tree.createNode({ value: props.note, parent: props.parent });
  const hasEditor = createMemo(() => node.id === props.treeView.newNoteEditor.newNote?.parentId);

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
        when={!node.isLeaf || hasEditor()}
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
            <Show when={hasEditor()}>
              <TitleEditor editor={props.treeView.newNoteEditor} />
            </Show>
            <Key each={node.childrenQuery.result.data} by="id">
              {(child, index) => (
                <Node
                  treeView={props.treeView}
                  parent={node}
                  note={child()}
                  indexPath={[...props.indexPath, index()]}
                />
              )}
            </Key>
          </TreeView.BranchContent>
        </TreeView.Branch>
      </Show>
    </TreeView.NodeProvider>
  );
}

export default Node;
