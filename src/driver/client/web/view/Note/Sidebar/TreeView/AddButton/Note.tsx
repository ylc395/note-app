import { Show } from 'solid-js';
import { LoaderIcon, PlusIcon } from 'lucide-solid';

import type { NoteVO } from '#domain/shared/model/note';
import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';

export default function (props: { iconOnly?: boolean; noteId?: NoteVO['id']; triggerClassName?: string }) {
  const {
    treeViews: {
      note: { newNoteEditor },
    },
  } = container.resolve(NoteService);

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    if (newNoteEditor.isSubmitting) {
      return;
    }
    newNoteEditor?.init({ parentId: props.noteId }, true);
  }

  return (
    <button class={`flex ${props.triggerClassName || ''}`} onClick={handleClick}>
      <Show
        when={newNoteEditor.value && props.noteId === newNoteEditor.value.parentId && newNoteEditor.isSubmitting}
        fallback={<PlusIcon />}
      >
        <LoaderIcon class="animate-spin" />
      </Show>
      <Show when={!props.iconOnly}>新建</Show>
    </button>
  );
}
