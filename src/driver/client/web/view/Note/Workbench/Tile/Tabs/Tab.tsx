import { createEffect, createMemo, onCleanup, onMount } from 'solid-js';
import { XIcon } from 'lucide-solid';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

import BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import { normalizeTitle } from '#domain/shared/model/note';
import { isFullyVisible } from '#web/infra/domUtils';
import { IS_DEV } from '#domain/shared/infra/env';

export default function Tab(props: { editor: BaseEditor }) {
  let rootRef: HTMLDivElement | undefined;
  const isCurrent = createMemo(() => props.editor.tile.currentEditor === props.editor);

  onMount(() => {
    createEffect(() => {
      if (props.editor.value.result.isSuccess && isCurrent() && rootRef && !isFullyVisible(rootRef)) {
        rootRef.scrollIntoView();
      }
    });
  });

  onMount(() => {
    const cleanup = combine(
      draggable({
        element: rootRef!,
        canDrag: () => props.editor.value.result.isSuccess,
        getInitialData: () => props.editor as unknown as Record<string, unknown>,
      }),
      dropTargetForElements({
        element: rootRef!,
        getData: () => props.editor as unknown as Record<string, unknown>,
      }),
    );

    onCleanup(cleanup);
  });

  return (
    <div
      ref={rootRef}
      class="shrink-0 h-12 flex justify-between items-center w-36 text-sm px-2 border-r border-border-secondary cursor-pointer group"
      classList={{ 'bg-white': isCurrent() }}
      onClick={() => props.editor.tile.switchToEditor(props.editor)}
    >
      <span class="whitespace-nowrap text-ellipsis overflow-hidden">
        {IS_DEV && `${props.editor.id}-${props.editor.noteId.slice(0.3)} `}
        {props.editor.value.result.data ? normalizeTitle(props.editor.value.result.data!) : ''}
      </span>
      <button
        class="flex ml-2 group-hover:visible"
        classList={{
          invisible: !isCurrent(),
        }}
        onClick={(e) => {
          e.stopPropagation();
          props.editor.destroy();
        }}
      >
        <XIcon />
      </button>
    </div>
  );
}
