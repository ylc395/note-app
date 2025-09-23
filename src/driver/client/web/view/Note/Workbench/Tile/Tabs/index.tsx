import { For, onCleanup, onMount } from 'solid-js';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import assert from 'assert';

import Tile from '#domain/client/app/model/Workbench/Tile';
import BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import Workbench from '#domain/client/app/model/Workbench';
import Tab from './Tab';

export default function Tabs(props: { tile: Tile }) {
  let rootRef: HTMLDivElement | undefined;
  const workbench = container.resolve(Workbench);

  function handleOnWheel(e: WheelEvent) {
    if (e.deltaX === 0) {
      const delta = 20;
      rootRef?.scrollBy({ left: e.deltaY < 0 ? -delta : delta });
    }
  }

  onMount(() => {
    const cleanup = dropTargetForElements({
      element: rootRef!,
      getData: () => props.tile as unknown as Record<string, unknown>,
      onDrop: ({ source, location }) => {
        const targetData = location.current.dropTargets[0]?.data;
        assert(targetData instanceof Tile || targetData instanceof BaseEditor);

        if (source.data instanceof BaseEditor) {
          source.data.moveTo(targetData);
        } else {
          const note = NoteService.getNote(source.data);

          if (note) {
            workbench.open(note, targetData);
          }
        }
      },
    });

    onCleanup(cleanup);
  });

  return (
    <div
      ref={rootRef}
      on:wheel={{ passive: true, handleEvent: handleOnWheel }}
      class="flex overflow-auto border-b border-border-secondary shrink-0 bg-surface-secondary text-text-secondary scrollbar-stable"
    >
      <For each={props.tile.editors}>{(editor) => <Tab editor={editor} />}</For>
    </div>
  );
}
