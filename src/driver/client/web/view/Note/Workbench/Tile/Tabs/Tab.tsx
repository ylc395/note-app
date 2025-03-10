import { createEffect, createMemo, onMount } from 'solid-js';
import { XIcon } from 'lucide-solid';

import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import { normalizeTitle } from '#domain/shared/model/note';
import type Tile from '#domain/client/app/model/Workbench/Tile';
import { isFullyVisible } from '#web/infra/domUtils';

export default function Tab(props: { editor: BaseEditor; tile: Tile }) {
  let rootRef: HTMLDivElement | undefined;
  const isCurrent = createMemo(() => props.tile.currentEditor === props.editor);

  onMount(() => {
    createEffect(() => {
      if (props.editor.value.result.isSuccess && isCurrent() && rootRef && !isFullyVisible(rootRef)) {
        rootRef.scrollIntoView();
      }
    });
  });

  return (
    <div
      ref={rootRef}
      class="shrink-0 h-12 flex justify-between items-center w-36 text-sm px-2 border-r cursor-pointer group"
      classList={{ 'bg-white': isCurrent() }}
      onClick={() => props.tile.switchToEditor(props.editor)}
    >
      <span class="whitespace-nowrap text-ellipsis overflow-hidden">
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
