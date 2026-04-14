import { Show, onCleanup } from 'solid-js';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { Key } from '@solid-primitives/keyed';

import NoteService from '#domain/client/app/service/NoteService';
import NodeView, { type Props as NodeProps } from './Node';

export default function BaseTree(props: {
  treeView: NodeProps['treeView'];
  renderOperation?: NodeProps['renderOperation'];
  onItemTitleClick: NodeProps['onItemTitleClick'];
  onContextMenuClick?: NodeProps['onContextMenuClick'];
  contextMenu?: NodeProps['contextMenu'];
  shouldRenderIcon?: NodeProps['shouldRenderIcon'];
  className?: string;
}) {
  const nodeGroupKey = Symbol();

  onCleanup(
    monitorForElements({
      onDragStart: ({ source }) => {
        const note = NoteService.getNote(source.data);

        if (note) {
          props.treeView.disableDescendantsBy(note);
        }
      },
      onDrop: () => {
        props.treeView.disableDescendantsBy([]);
      },
    }),
  );

  // 这里不使用 arkui 提供的 Tree 组件，因为对于动态加载节点的场景，它实现得有问题，性能很差
  return (
    <Show when={props.treeView.tree?.root}>
      {(rootNode) => (
        <ul class={props.className} data-tree>
          <Key each={rootNode().sortedChildren} by="id">
            {(node, index) => (
              <NodeView
                groupKey={nodeGroupKey}
                onItemTitleClick={props.onItemTitleClick}
                onContextMenuClick={props.onContextMenuClick}
                contextMenu={props.contextMenu}
                renderOperation={props.renderOperation}
                treeView={props.treeView}
                shouldRenderIcon={props.shouldRenderIcon}
                node={node()}
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
