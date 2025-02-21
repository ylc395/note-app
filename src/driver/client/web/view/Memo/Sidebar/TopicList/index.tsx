import { createMemo, For, Show } from 'solid-js';
import { createTreeCollection, TreeView } from '@ark-ui/solid';

import { container } from '#domain/shared/infra/singletons';
import type { TopicNode } from '#domain/client/app/model/TopicList';
import MemoList from '#domain/client/app/model/memo/List';
import Node from './Node';

export default function TopicListView() {
  const {
    filter: { topicList },
  } = container.resolve(MemoList);

  const collection = createMemo(() =>
    topicList.tree
      ? createTreeCollection<TopicNode>({
          rootNode: { children: topicList.tree, id: 'TopicNode_ROOT', name: '', entities: [] },
          nodeToValue: (node) => node.id, // ark-ui 用这个方法来区分每一个 node
        })
      : null,
  );

  return (
    <Show when={topicList.hasContent}>
      <div class="mt-4 text-gray-400 flex flex-col min-h-8">
        <h3 class="font-semibold mb-2 text-sm">#话题一览</h3>
        <Show when={collection()}>
          {(tree) => (
            <TreeView.Root
              lazyMount
              unmountOnExit
              collection={tree()}
              expandOnClick={false}
              selectionMode="multiple"
              class="min-h-0 overflow-auto"
              selectedValue={topicList.selectedTopics}
              onSelectionChange={(e) => topicList.setSelected(e.selectedValue)}
            >
              <TreeView.Tree>
                <For each={topicList.tree}>{(node, index) => <Node node={node} indexPath={[index()]} />}</For>
              </TreeView.Tree>
            </TreeView.Root>
          )}
        </Show>
      </div>
    </Show>
  );
}
