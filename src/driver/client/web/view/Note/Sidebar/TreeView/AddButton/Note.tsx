import { Show } from 'solid-js';
import { PlusIcon } from 'lucide-solid';

import type { NoteVO } from '#domain/shared/model/note';
import { container } from '#domain/shared/infra/singletons';
import NoteService from '#domain/client/app/service/NoteService';

export default function (props: { iconOnly?: boolean; noteId?: NoteVO['id'] }) {
  const { treeViews } = container.resolve(NoteService);

  return (
    <button class="flex" onClick={() => treeViews.note.newNoteEditor?.create({ parentId: props.noteId }, true)}>
      <PlusIcon />
      <Show when={!props.iconOnly}>新建</Show>
    </button>
  );
}
