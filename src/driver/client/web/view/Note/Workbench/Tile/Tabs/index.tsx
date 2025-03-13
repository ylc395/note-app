import { For, onCleanup, onMount } from 'solid-js';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import assert from 'assert';

import Tile from '#domain/client/app/model/Workbench/Tile';
import BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';
import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import Workbench from '#domain/client/app/model/Workbench';
import Tab from './Tab';

export default function Tabs(props: { tile: Tile }) {
  let rootRef: HTMLDivElement | undefined;
  const workbench = container.resolve(Workbench);

  function handleOnWheel(e: WheelEvent) {
    e.preventDefault();
    rootRef?.scrollBy({ left: e.deltaY < 0 ? -30 : 30 });
  }

  onMount(() => {
    const cleanup = dropTargetForElements({
      element: rootRef!,
      getData: () => props.tile as unknown as Record<string, unknown>,
      onDrop: ({ source, location }) => {
        const targetData = location.current.dropTargets[0]?.data;
        const note = NoteService.getNote(source.data);

        if (!note) {
          return;
        }

        assert(targetData instanceof Tile || targetData instanceof BaseEditor);
        workbench.open(note, targetData);
      },
    });

    onCleanup(cleanup);
  });

  return (
    <div ref={rootRef} onWheel={handleOnWheel} class="flex overflow-auto border-b">
      <For each={props.tile.editors}>{(editor) => <Tab editor={editor} />}</For>
    </div>
  );
}
