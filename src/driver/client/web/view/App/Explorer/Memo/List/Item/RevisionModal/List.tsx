import { For } from 'solid-js';
import dayjs from 'dayjs';

import type { RevisionVO } from '#domain/shared/model/revision';

export default function List(props: {
  revisions: RevisionVO[];
  onSelect: (id: RevisionVO['id']) => void;
  selectedId: RevisionVO['id'] | undefined;
}) {
  return (
    <div class="w-48 shrink-0 overflow-y-auto border-r border-border-secondary py-2 bg-bg-secondary">
      <For each={props.revisions}>
        {(revision) => (
          <div
            class="mx-1 px-2.5 py-1.5 rounded text-xs text-fg-secondary cursor-pointer hover:bg-bg-hover transition-colors"
            classList={{
              'bg-bg-accent-subtle text-fg-accent-subtle': revision.id === props.selectedId,
            }}
            onclick={() => props.onSelect(revision.id)}
          >
            {dayjs(revision.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </div>
        )}
      </For>
    </div>
  );
}
