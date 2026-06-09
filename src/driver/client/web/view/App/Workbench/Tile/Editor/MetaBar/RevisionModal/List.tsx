import { For } from 'solid-js';
import dayjs from 'dayjs';

import type { RevisionVO } from '#domain/shared/model/revision';

export default function List(props: {
  revisions: RevisionVO[];
  onSelect: (id: RevisionVO['id']) => void;
  selectedId: RevisionVO['id'] | undefined;
}) {
  return (
    <div class="mr-4 min-w-[200px] overflow-auto">
      <For each={props.revisions}>
        {(revision) => (
          <div
            class={`cursor-pointer rounded px-2 py-1 text-sm ${
              revision.id === props.selectedId ? 'bg-bg-active' : 'hover:bg-bg-hover'
            }`}
            onclick={() => props.onSelect(revision.id)}
          >
            {dayjs(revision.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </div>
        )}
      </For>
    </div>
  );
}
