import { Key } from '@solid-primitives/keyed';
import { Show, type JSX } from 'solid-js';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { onCleanup } from 'solid-js';
import NoteService from '#domain/client/app/service/NoteService';

import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import type NewNoteForm from '#domain/client/app/model/note/TreeView/NewNoteForm';
import TreeViewModel from '#domain/client/app/model/note/TreeView';

import NodeView from './Node';
import TitleEditor from './TitleEditor';

export default function NoteTree(props: {
  treeView: TreeViewModel;
  useNewNoteEditor?: boolean;
  operation: (node: TreeNode) => JSX.Element;
  icon?: (node: TreeNode | NewNoteForm) => JSX.Element;
  onItemTitleClick: (node: TreeNode) => void;
}) {
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

  // 这里不使用 arkui 提供的 Tree 组件，因为它实现得有问题，性能很差
  return (
    <Show when={props.treeView.tree.root}>
      {(rootNode) => (
        <ul class="menu p-0 w-full" style={{ '--depth': 0 }}>
          <Show when={props.useNewNoteEditor && props.treeView.newNoteFormMap.get(rootNode().id)}>
            {(form) => (
              <li>
                <TitleEditor editor={form()} />
              </li>
            )}
          </Show>
          <Key each={rootNode().childrenQuery.result.data} by="id">
            {(note, index) => (
              <NodeView
                onItemTitleClick={props.onItemTitleClick}
                operation={props.operation}
                treeView={props.treeView}
                icon={props.icon}
                note={note()}
                parent={rootNode()}
                indexPath={[index()]}
              />
            )}
          </Key>
        </ul>
      )}
    </Show>
  );
}
