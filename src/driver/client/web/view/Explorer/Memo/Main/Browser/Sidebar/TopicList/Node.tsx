import { TriangleIcon } from 'lucide-solid';
import { For, Show, createSignal } from 'solid-js';

import type { TopicNode } from '#domain/client/app/model/TopicList';
import { container } from '#domain/shared/infra/singletons';
import MemoService from '#domain/client/app/service/MemoService';

export default function Node({ node, level }: { node: TopicNode; level?: number }) {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const { topicList } = container.resolve(MemoService);

  return (
    <div>
      <div class="flex items-center" onclick={(e) => topicList.toggle(node, e.metaKey)}>
        <Show when={node.children.length > 0}>
          <button
            onclick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded());
            }}
          >
            <TriangleIcon class="rotate-180 text-xs mr-1" />
          </button>
        </Show>
        {node.name}
        <Show when={node.entities.length > 0}>
          <span class="number-suffix">{node.entities.length}</span>
        </Show>
      </div>
      <Show when={node.children.length > 0 && isExpanded()}>
        <div style={{ 'padding-left': `${(level ?? 1) * 5}px` }}>
          <For each={node.children}>{(child) => <Node node={child} level={(level ?? 0) + 1} />}</For>
        </div>
      </Show>
    </div>
  );
}
