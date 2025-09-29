import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { monitorForElements, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { HandIcon } from 'lucide-solid';

import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import { TreeNodeStates } from '#domain/client/app/model/note/TreeExplorer';

export default function DropArea() {
  const { move, exploreTreeView: treeView } = container.resolve(NoteService);
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
            move(note, null);
          }
        },
      });
      onCleanup(cleanup);
    }
  });

  onCleanup(cleanup);

  return (
    <Show when={isDragging() && !treeView.tree?.root.is(TreeNodeStates.Unselectable)}>
      <div
        ref={setDropArea}
        class="border border-border-primary text-text-secondary rounded border-dashed text-xs text-center flex items-center justify-center absolute top-0 right-0 bottom-0 left-2 bg-surface-secondary z-20"
      >
        <HandIcon class="w-3 h-3 mr-1" />
        拖拽至此以移动至根节点
      </div>
    </Show>
  );
}
