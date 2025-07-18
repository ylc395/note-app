import { createTreeCollection, TreeView } from '@ark-ui/solid';
import { Key } from '@solid-primitives/keyed';
import { createMemo, Show, type JSX } from 'solid-js';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { onCleanup } from 'solid-js';
import NoteService from '#domain/client/app/service/NoteService';

import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import type NewNoteForm from '#domain/client/app/model/note/TreeView/NewNoteForm';
import TreeViewModel from '#domain/client/app/model/note/TreeView';

import NodeView from './Node';
import TitleEditor from './TitleEditor';
import { untrack } from 'solid-js';

export default function NoteTree(props: {
  treeView: TreeViewModel;
  useNewNoteEditor?: boolean;
  operation: (node: TreeNode) => JSX.Element;
  icon?: (node: TreeNode | NewNoteForm) => JSX.Element;
  onItemTitleClick: (node: TreeNode) => void;
}) {
  const collection = createMemo(() => {
    const root = props.treeView.tree.root;

    if (root) {
      return untrack(() =>
        createTreeCollection<TreeNode>({
          rootNode: root,
          nodeToValue: (node) => node.id,
          nodeToChildren: (node) => {
            // 这个 node 的类型和标注的不一致，有可能为 undefined
            return node?.childrenQuery.result.data?.map(({ id }) => props.treeView.tree.get(id)) ?? [];
          },
        }),
      );
    }
  });

  onCleanup(
    monitorForElements({
      onDragStart: ({ source }) => {
        const note = NoteService.getNote(source.data);

        if (note) {
          props.treeView.disableDescendantsBy([note]);
        }
      },
      onDrop: () => {
        props.treeView.disableDescendantsBy([]);
      },
    }),
  );

  return (
    <Show when={collection()}>
      {(_collection) => (
        <TreeView.Root
          class="overflow-auto h-full scrollbar-stable"
          collection={_collection()}
          expandOnClick={false}
          expandedValue={Array.from(props.treeView.tree.expandedNodeIds)}
        >
          <TreeView.Tree
            asChild={(childProps) => (
              <ul {...childProps()} class="menu p-0 w-full">
                <Show when={props.useNewNoteEditor && props.treeView.newNoteFormMap.get(_collection().rootNode.id)}>
                  {(form) => (
                    <li>
                      <TitleEditor editor={form()} />
                    </li>
                  )}
                </Show>
                <Key each={_collection().rootNode.childrenQuery.result.data} by="id">
                  {(note, index) => (
                    <NodeView
                      onItemTitleClick={props.onItemTitleClick}
                      operation={props.operation}
                      treeView={props.treeView}
                      icon={props.icon}
                      note={note()}
                      parent={_collection().rootNode}
                      indexPath={[index()]}
                    />
                  )}
                </Key>
              </ul>
            )}
          />
        </TreeView.Root>
      )}
    </Show>
  );
}
