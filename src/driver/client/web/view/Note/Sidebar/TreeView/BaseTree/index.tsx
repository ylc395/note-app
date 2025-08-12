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

export const addButtonClassName =
  'button button-primary button-square-tiny text-brand-secondary h-full ml-inset-squish group-hover:flex data-[state="open"]:flex hidden';

export default function BaseTree(props: {
  treeView: TreeViewModel;
  useNewNoteEditor?: boolean;
  renderOperation: (node: TreeNode) => JSX.Element;
  renderIcon?: (node: TreeNode | NewNoteForm) => JSX.Element;
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
        <ul class="text-sm w-full">
          <Show when={props.useNewNoteEditor && props.treeView.newNoteFormMap.get(rootNode().id)}>
            {(form) => (
              <li class="ml-5 px-inset-square-s">
                <div class="flex items-center">
                  {props.renderIcon?.(form())}
                  <TitleEditor newNoteForm={form()} />
                </div>
              </li>
            )}
          </Show>
          <Key each={rootNode().childrenQuery.result.data} by="id">
            {(note, index) => (
              <NodeView
                onItemTitleClick={props.onItemTitleClick}
                renderOperation={props.renderOperation}
                renderIcon={props.renderIcon}
                treeView={props.treeView}
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
