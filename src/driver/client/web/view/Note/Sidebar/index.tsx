import { Splitter } from '@ark-ui/solid';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { monitorForElements, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import { container } from '#domain/shared/infra/singletons';
import NoteService from '#domain/client/app/service/NoteService';
import TreeView from './TreeView';

export default function Sidebar(props: { panelId: string }) {
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
    <Splitter.Panel id={props.panelId} class="border-r h-full flex flex-col min-w-60 py-4 pl-4">
      <div class="flex items-center mb-2">
        <h1>NOTE</h1>
        <Show when={isDragging()}>
          <div ref={setDropArea} class="mx-2 border border-black rounded border-dashed text-sm grow text-center py-1">
            拖拽至此以移动至根节点
          </div>
        </Show>
      </div>
      <TreeView />
    </Splitter.Panel>
  );
}
