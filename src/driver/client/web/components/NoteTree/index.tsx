import { Key } from '@solid-primitives/keyed';
import { Show, type JSX, onCleanup } from 'solid-js';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { FolderIcon, FileTextIcon } from 'lucide-solid';

import { MimeTypes } from '#domain/shared/model/file';
import NoteService from '#domain/client/app/service/NoteService';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import TreeViewModel from '#domain/client/app/model/note/TreeView';

import NodeView from './Node';

export default function BaseTree(props: {
  treeView: TreeViewModel;
  renderOperation?: (node: TreeNode) => JSX.Element;
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

  function renderIcon(node: TreeNode) {
    const className = 'mr-2 p-0 shrink-0 w-4 h-4 inline align-text-bottom';

    if (!(node instanceof TreeNode)) {
      return <FolderIcon class={className} />;
    }

    if (node.value?.icon) {
      return null; // todo: 改成图标
    }

    if (!node.value?.mimeType) {
      return <FileTextIcon class={className} />;
    }

    switch (node.value.mimeType) {
      case MimeTypes.PDF:
        return <FileTextIcon class={className} />;
      default:
        break;
    }
  }

  // 这里不使用 arkui 提供的 Tree 组件，因为它实现得有问题，性能很差
  return (
    <Show when={props.treeView.tree.root}>
      {(rootNode) => (
        <ul class={props.className}>
          <Key each={rootNode().childrenQuery.result.data} by="id">
            {(note, index) => (
              <NodeView
                onItemTitleClick={props.onItemTitleClick}
                renderOperation={props.renderOperation}
                renderIcon={renderIcon}
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
