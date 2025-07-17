import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { monitorForElements, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import UIState from '#web/view/UIState';
import { TargetIcon } from 'lucide-solid';

export default function DropArea() {
  const { move, getOrCreateTreeView } = container.resolve(NoteService);
  const [isDragging, setIsDragging] = createSignal(false);
  const [dropAreaRef, setDropArea] = createSignal<HTMLDivElement>();
  const uiState = container.resolve(UIState);
  const treeView = createMemo(() => getOrCreateTreeView(uiState.get('note.treeView')));

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
    <Show when={isDragging() && !treeView().tree.root?.isUnselectable}>
      <div
        ref={setDropArea}
        class="border border-black rounded border-dashed text-xs text-center flex items-center justify-center absolute top-0 right-0 bottom-0 left-2 bg-inherit"
      >
        <TargetIcon class="w-3 h-3 mr-1" />
        拖拽至此以移动至根节点
      </div>
    </Show>
  );
}
