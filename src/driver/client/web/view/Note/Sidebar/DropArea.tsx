import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { monitorForElements, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

export default function DropArea() {
  const { move } = container.resolve(NoteService);
  const [isDragging, setIsDragging] = createSignal(false);
  const [dropAreaRef, setDropArea] = createSignal<HTMLDivElement>();

  const cleanup = monitorForElements({
    onDragStart: ({ source }) => {
      if (NoteService.getNote(source.data)) {
        setIsDragging(true);
      }
    },
    onDrop: () => setIsDragging(false),
  });

  createEffect(() => {
    const dropAreaElement = dropAreaRef();

    if (dropAreaElement) {
      const cleanup = dropTargetForElements({
        element: dropAreaElement,
        onDrop: ({ source }) => {
          const note = NoteService.getNote(source.data);

          if (note) {
            move(note.id, null);
          }
        },
      });
      onCleanup(cleanup);
    }
  });

  onCleanup(cleanup);

  return (
    <Show when={isDragging()}>
      <div
        ref={setDropArea}
        class="border border-black rounded border-dashed text-sm text-center flex items-center justify-center absolute inset-0"
      >
        拖拽至此以移动至根节点
      </div>
    </Show>
  );
}
