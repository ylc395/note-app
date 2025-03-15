import { Splitter } from '@ark-ui/solid';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import type Tile from '#domain/client/app/model/Workbench/Tile';
import { TileSplitDirections } from '#domain/client/app/model/Workbench';

import Tabs from './Tabs';
import Editor from './Editor';
import DropIndicator from './DropIndicator';
import dragHandler from './dragHandler';

export default function TileView(props: { tile: Tile; panelId?: string }) {
  const [tileRef, setTileRef] = createSignal<HTMLElement>();
  const [tileDirection, setTileDirection] = createSignal<TileSplitDirections | 'middle'>();

  createEffect(() => {
    const tileElement = tileRef();

    if (!tileElement) {
      return;
    }

    const cleanup = dropTargetForElements(
      dragHandler({
        tileElement,
        tile: props.tile,
        onDirectionChange: setTileDirection,
      }),
    );
    onCleanup(cleanup);
  });

  const content = (
    <>
      <Tabs tile={props.tile} />
      <Show when={props.tile.currentEditor}>
        {(editor) => (
          <div class="h-full relative" ref={setTileRef}>
            <Editor editor={editor()} />
            <Show when={tileDirection()}>{(value) => <DropIndicator tileDirection={value()} />}</Show>
          </div>
        )}
      </Show>
    </>
  );

  if (props.panelId) {
    return (
      <Splitter.Panel class="flex flex-col" id={props.panelId}>
        {content}
      </Splitter.Panel>
    );
  }

  return <div class="h-full flex flex-col">{content}</div>;
}
