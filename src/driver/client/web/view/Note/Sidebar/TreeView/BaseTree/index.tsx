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
  onItemTitleClick: (node: TreeNode) => void;
}) {
  const collection = createTreeCollection<TreeNode>({
    rootNode: props.treeView.tree.root,
    nodeToValue: (node) => node.id,
    nodeToChildren: (node) => node.childrenQuery.result.data?.map(({ id }) => props.treeView.tree.get(id)) ?? [],
  });

  return (
    <TreeView.Root
      class="overflow-auto h-full scrollbar-stable"
      collection={collection}
      expandOnClick={false}
      expandedValue={Array.from(props.treeView.tree.expandedNodeIds)}
    >
      <TreeView.Tree
        asChild={(childProps) => (
          <ul {...childProps()} class="menu p-0 w-full">
            <Show when={props.useNewNoteEditor && props.treeView.newNoteFormMap.get(props.treeView.tree.root.id)}>
              {(form) => (
                <li>
                  <TitleEditor editor={form()} />
                </li>
              )}
            </Show>
            <Key each={collection.rootNode.childrenQuery.result.data} by="id">
              {(note, index) => (
                <NodeView
                  onItemTitleClick={props.onItemTitleClick}
                  operation={props.operation}
                  treeView={props.treeView}
                  icon={props.icon}
                  note={note()}
                  parent={props.treeView.tree.root}
                  indexPath={[index()]}
                />
              )}
            </Key>
          </ul>
        )}
      />
    </TreeView.Root>
  );
}
