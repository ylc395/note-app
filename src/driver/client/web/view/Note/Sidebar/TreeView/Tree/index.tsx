import { createTreeCollection, TreeView } from '@ark-ui/solid';
import { Key } from '@solid-primitives/keyed';

import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import TreeViewModel from '#domain/client/app/model/note/TreeView';

import NodeView from './Node';
import { Show } from 'solid-js';
import TitleEditor from './TitleEditor';

export default function NoteTree(props: { treeView: TreeViewModel; useNewNoteEditor?: boolean }) {
  const collection = createTreeCollection<TreeNode>({
    rootNode: props.treeView.tree.root,
    nodeToValue: (node) => node.id,
  });

  return (
    <TreeView.Root class="overflow-auto min-h-0" collection={collection}>
      <TreeView.Tree>
        <Show
          when={
            props.useNewNoteEditor &&
            props.treeView.newNoteEditor.newNote &&
            !props.treeView.newNoteEditor.newNote!.parentId
          }
        >
          <TitleEditor editor={props.treeView.newNoteEditor} />
        </Show>
        <Key each={collection.rootNode.childrenQuery.result.data} by="id">
          {(note, index) => (
            <NodeView treeView={props.treeView} note={note()} parent={props.treeView.tree.root} indexPath={[index()]} />
          )}
        </Key>
      </TreeView.Tree>
    </TreeView.Root>
  );
}
