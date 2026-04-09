import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { monitorForElements, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { monitorForExternal, dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter';
import { HandIcon } from 'lucide-solid';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { compact } from 'lodash-es';

import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import { TreeNodeStates } from '#domain/client/app/model/note/TreeExplorer';
import { transferItemToFileDTO } from '#web/utils/file';

export default function DropArea() {
  const { updateNote: move, explorer: treeView, createNotesWithFile } = container.resolve(NoteService);
  const [isDragging, setIsDragging] = createSignal(false);
  const [dropAreaRef, setDropArea] = createSignal<HTMLDivElement>();

  const cleanup = combine(
    monitorForExternal({
      onDragStart: () => {
        setIsDragging(true);
      },
      onDrop: () => setIsDragging(false),
    }),
    monitorForElements({
      onDragStart: ({ source }) => {
        if (NoteService.getNote(source.data)) {
          setIsDragging(true);
        }
      },
      onDrop: () => setIsDragging(false),
    }),
  );

  createEffect(() => {
    const dropAreaElement = dropAreaRef();

    if (dropAreaElement) {
      const cleanup = combine(
        dropTargetForElements({
          element: dropAreaElement,
          onDrop: ({ source }) => {
            const note = NoteService.getNote(source.data);

            if (note) {
              move(note, { parentId: null });
            }
          },
        }),
        dropTargetForExternal({
          element: dropAreaElement,
          onDrop: async ({ source }) => {
            const files = compact(await Promise.all(source.items.map(transferItemToFileDTO)));

            createNotesWithFile({
              files,
              onDuplicated: (upload) => upload(),
            });
          },
        }),
      );
      onCleanup(cleanup);
    }
  });

  onCleanup(cleanup);

  return (
    <Show when={isDragging() && !treeView.tree?.root.is(TreeNodeStates.Unselectable)}>
      <div
        ref={setDropArea}
        class="border border-border-primary text-fg-secondary rounded border-dashed text-xs text-center flex items-center justify-center absolute top-0 right-0 bottom-0 left-2 bg-bg-secondary z-20"
      >
        <HandIcon class="w-3 h-3 mr-1" />
        拖拽至此以移动至根节点
      </div>
    </Show>
  );
}
