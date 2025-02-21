import { TreeView } from '@ark-ui/solid';
import { createEffect, on, onCleanup, Show } from 'solid-js';
import { Key } from '@solid-primitives/keyed';

import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import type Tree from '#domain/client/shared/model/note/Tree';
import { container } from '#domain/shared/infra/singletons';
import NoteService from '#domain/client/app/service/NoteService';

import TitleEditor from './TitleEditor';

function Node(props: { tree: Tree; note: NoteVO; parent: TreeNode; indexPath: number[] }) {
  const node = props.tree.createNode({ value: props.note, parent: props.parent });
  const {
    treeViews: { [props.tree.type]: treeView },
  } = container.resolve(NoteService);

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
            <Show when={treeView.newNoteEditor.newNote?.id === node.id}>
              <TitleEditor editor={treeView.newNoteEditor} />
            </Show>
            <TreeView.ItemText>{normalizeTitle(node.value!)}</TreeView.ItemText>
          </TreeView.Item>
        }
      >
        <TreeView.Branch>
          <TreeView.BranchControl>
            <Show
              when={treeView.newNoteEditor.newNote?.id === node.id}
              fallback={<TreeView.BranchText>{normalizeTitle(node.value!)}</TreeView.BranchText>}
            >
              <TitleEditor editor={treeView.newNoteEditor} />
            </Show>
          </TreeView.BranchControl>
          <Show when={node.childrenQuery.result.data && node.childrenQuery.result.data.length > 0}>
            <TreeView.BranchContent>
              <Key each={node.childrenQuery.result.data} by="id">
                {(child, index) => (
                  <Node tree={props.tree} parent={node} note={child()} indexPath={[...props.indexPath, index()]} />
                )}
              </Key>
            </TreeView.BranchContent>
          </Show>
        </TreeView.Branch>
      </Show>
    </TreeView.NodeProvider>
  );
}

export default Node;
