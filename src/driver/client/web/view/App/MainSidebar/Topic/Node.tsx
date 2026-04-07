import { ChevronDownIcon, ChevronRightIcon } from 'lucide-solid';
import { For, Show } from 'solid-js';
import container from '#utils/singletonContainer';

import TopicService, { type TopicNode } from '#domain/client/app/service/TopicService';

export default function Node(props: { node: TopicNode }) {
  const {
    globalTopicTree: { expandedIds, toggleExpand },
  } = container.resolve(TopicService);

  return (
    <div>
      <div class="flex" onClick={() => toggleExpand(props.node.id)}>
        <Show when={expandedIds.has(props.node.id)} fallback={<ChevronRightIcon />}>
          <ChevronDownIcon />
        </Show>
        <span>{props.node.name}</span>
      </div>
      <Show when={expandedIds.has(props.node.id)}>
        <div class="pl-4">
          <For each={props.node.children}>{(node) => <Node node={node} />}</For>
          <For each={props.node.entities}>{({ title }) => title}</For>
        </div>
      </Show>
    </div>
  );
}
