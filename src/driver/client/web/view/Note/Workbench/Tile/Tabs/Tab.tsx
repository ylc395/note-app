import { createEffect, createMemo, onMount, Show } from 'solid-js';
import { XIcon } from 'lucide-solid';
import { last } from 'lodash-es';

import type BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import { normalizeTitle } from '#domain/shared/model/note';
import type Tile from '#domain/client/app/model/Workbench/Tile';

export default function Tab(props: { editor: BaseEditor; tile: Tile }) {
  let rootRef: HTMLDivElement | undefined;
  const isCurrent = createMemo(() => props.tile.currentEditor === props.editor);

  onMount(() => {
    createEffect(() => {
      if (props.editor.value.result.isSuccess && isCurrent()) {
        rootRef?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
      }
    });
  });

  return (
    <div
      ref={rootRef}
      class="shrink-0 h-12 flex items-center max-w-48 min-w-12 grow text-sm px-2 border-r cursor-pointer"
      classList={{ 'bg-white': isCurrent() }}
      onClick={() => props.tile.switchToEditor(props.editor)}
    >
      <span class="whitespace-nowrap text-ellipsis overflow-hidden">
        {props.editor.value.result.data ? normalizeTitle(props.editor.value.result.data!) : ''}
      </span>
      <Show
        when={
          props.tile.editorsWithDuplicatedTitle.has(props.editor) &&
          props.editor.path.result.data &&
          props.editor.path.result.data.length > 0
        }
      >
        <span class="shrink-0">
          <Show when={props.editor.path.result.data!.length > 1}>.../</Show>
          {last(props.editor.path.result.data)!.title}
        </span>
      </Show>
      <button
        class="flex"
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
