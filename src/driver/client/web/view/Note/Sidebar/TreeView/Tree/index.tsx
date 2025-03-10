import { createTreeCollection, TreeView } from '@ark-ui/solid';
import { Key } from '@solid-primitives/keyed';
import { Show, type JSX } from 'solid-js';

import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import TreeViewModel from '#domain/client/app/model/note/TreeView';

import NodeView from './Node';
import TitleEditor from './TitleEditor';

export default function NoteTree(props: {
  treeView: TreeViewModel;
  useNewNoteEditor?: boolean;
  operation: (node: TreeNode) => JSX.Element;
  icon?: (node: TreeNode) => JSX.Element;
}) {
  const collection = createTreeCollection<TreeNode>({
    rootNode: props.treeView.tree.root,
    nodeToValue: (node) => node.id,
    nodeToChildren: (node) => node.childrenQuery.result.data?.map(({ id }) => props.treeView.tree.get(id)) ?? [],
  });

  return (
    <TreeView.Root
      class="overflow-auto min-h-0"
      collection={collection}
      expandOnClick={false}
      expandedValue={Array.from(props.treeView.tree.expandedNodeIds)}
    >
      <TreeView.Tree>
        <Show
          when={
            props.useNewNoteEditor &&
            props.treeView.newNoteEditor?.value &&
            !props.treeView.newNoteEditor.value.parentId
          }
        >
          <TitleEditor editor={props.treeView.newNoteEditor!} />
        </Show>
        <Key each={collection.rootNode.childrenQuery.result.data} by="id">
          {(note, index) => (
            <NodeView
              operation={props.operation}
              treeView={props.treeView}
              icon={props.icon}
              note={note()}
              parent={props.treeView.tree.root}
              indexPath={[index()]}
            />
          )}
        </Key>
      </TreeView.Tree>
    </TreeView.Root>
  );
}
