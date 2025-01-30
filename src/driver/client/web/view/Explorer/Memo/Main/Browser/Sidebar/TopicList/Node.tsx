import { TriangleIcon } from 'lucide-solid';
import { For, Show, createSignal } from 'solid-js';

import type { TopicNode } from '#domain/client/app/model/TopicList';

export default function Node({ node, level }: { node: TopicNode; level?: number }) {
  const [isExpanded, setIsExpanded] = createSignal(false);

  return (
    <div>
      <div class="flex items-center">
        <Show when={node.children.length > 0}>
          <button onclick={() => setIsExpanded(!isExpanded())}>
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
