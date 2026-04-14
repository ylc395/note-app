import { createSignal, onCleanup, Show } from 'solid-js';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { monitorForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter';
import { HandIcon } from 'lucide-solid';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import { TreeNodeStates } from '#domain/client/app/model/note/TreeExplorer';
import useDnd from '#web/view/components/NoteTree/useDnd';

export default function DropArea() {
  const { explorer: treeView } = container.resolve(NoteService);
  const [isDragging, setIsDragging] = createSignal(false);
  const { setDndElementRef } = useDnd({ treeView, draggable: false });

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

  onCleanup(cleanup);

  return (
    <Show when={isDragging() && !treeView.tree?.root.is(TreeNodeStates.Unselectable)}>
      <div
        ref={setDndElementRef}
        class="border border-border-primary text-fg-secondary rounded border-dashed text-xs text-center flex items-center justify-center absolute top-0 right-0 bottom-0 left-2 bg-bg-secondary z-20"
      >
        <HandIcon class="w-3 h-3 mr-1" />
        拖拽至此以移动至根节点
      </div>
    </Show>
  );
}
