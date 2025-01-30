import { For } from 'solid-js';

import MemoService from '#domain/client/app/service/MemoService';
import { container } from '#domain/shared/infra/singletons';
import Node from './Node';

export default function TopicListView() {
  const { topicList } = container.resolve(MemoService);

  return (
    <div class="mt-4 text-gray-400">
      <h3 class="font-semibold mb-2 text-sm">#话题一览</h3>
      <div class="space-y-2">
        <For each={topicList.tree}>{(topic) => <Node node={topic} />}</For>
      </div>
    </div>
  );
}
