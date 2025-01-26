import { For } from 'solid-js';
import dayjs from 'dayjs';

import type { RevisionVO } from '#domain/shared/model/revision';

export default function List(props: {
  revisions: RevisionVO[];
  onSelect: (id: RevisionVO['id']) => void;
  selectedId: RevisionVO['id'] | undefined;
}) {
  return (
    <div class="mr-4">
      <For each={props.revisions}>
        {(revision) => (
          <div onclick={() => props.onSelect(revision.id)}>
            版本 {dayjs(revision.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </div>
        )}
      </For>
    </div>
  );
}
