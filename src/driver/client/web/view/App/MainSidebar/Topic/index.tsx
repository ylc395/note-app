import { createMemo, For, Show } from 'solid-js';
import { createTreeCollection, TreeView } from '@ark-ui/solid';

import TopicService, { type TopicNode } from '#domain/client/app/service/TopicService';
import container from '#utils/singletonContainer';
import Node from './Node';

export default function Topic(props: { onOpen: () => void }) {
  const { globalTopicTree } = container.resolve(TopicService);

  const collection = createMemo(() =>
    globalTopicTree.data.result.data
      ? createTreeCollection<TopicNode>({
          rootNode: { children: globalTopicTree.data.result.data, id: 'TopicNode_ROOT', name: '', entities: [] },
          nodeToValue: (node) => node.id, // ark-ui 在“展开节点”等组件功能中，依赖了这个方法
        })
      : null,
  );

  globalTopicTree.data.refetch();

  return (
    <div class="bg-bg-primary">
      <h2>话题</h2>
      <Show when={collection()}>
        {(tree) => (
          <TreeView.Root lazyMount unmountOnExit collection={tree()} class="min-h-0 overflow-auto">
            <TreeView.Tree>
              <For each={tree().rootNode.children}>{(node) => <Node node={node} />}</For>
            </TreeView.Tree>
          </TreeView.Root>
        )}
      </Show>
    </div>
  );
}
