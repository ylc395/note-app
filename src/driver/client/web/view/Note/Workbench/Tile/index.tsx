import { Splitter } from '@ark-ui/solid';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import type Tile from '#domain/client/app/model/Workbench/Tile';
import { TileSplitDirections } from '#domain/client/app/model/Workbench';

import Tabs from './Tabs';
import TitleInput from './TitleInput';
import Editor from './Editor';
import DropIndicator from './DropIndicator';
import dragHandler from './dragHandler';

export default function TileView(props: {
  tile: Tile;
  panelId?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
}) {
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
          <div class="flex flex-col grow relative" ref={setTileRef}>
            <Show when={tileDirection()}>{(value) => <DropIndicator tileDirection={value()} />}</Show>
            <TitleInput editor={editor()} />
            <Editor editor={editor()} />
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
