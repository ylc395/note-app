import { Key } from '@solid-primitives/keyed';
import { Show, type JSX, onCleanup, type JSXElement } from 'solid-js';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import NoteService from '#domain/client/app/service/NoteService';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import TreeViewModel from '#domain/client/app/model/note/TreeView';

import NodeView from './Node';

export default function BaseTree(props: {
  treeView: TreeViewModel;
  renderOperation?: (node: TreeNode) => JSX.Element;
  renderItem?: (original: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSXElement) => JSXElement;
  onItemTitleClick: (node: TreeNode) => void;
  className?: string;
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
        <ul class={props.className}>
          <Key each={rootNode().childrenQuery.result.data} by="id">
            {(note, index) => (
              <NodeView
                onItemTitleClick={props.onItemTitleClick}
                renderItem={props.renderItem}
                renderOperation={props.renderOperation}
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
