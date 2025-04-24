import { Splitter } from '@ark-ui/solid';
import { Show } from 'solid-js';

import { TileDirections, type TileNode, type TileParent } from '#domain/client/app/model/Workbench/tileTree';
import container from '#utils/singletonContainer';
import Workbench from '#domain/client/app/model/Workbench';

import Tile from './Tile';

function TileParentNode(props: { panelId?: string; tile: TileParent }) {
  const content = (
    <Splitter.Root
      orientation={props.tile.direction === TileDirections.Horizontal ? 'horizontal' : 'vertical'}
      defaultSize={[
        { id: `${props.tile.id}-first`, size: 50, minSize: 20 },
        { id: `${props.tile.id}-second`, size: 50, minSize: 20 },
      ]}
    >
      <TileNodeView parent={props.tile} panelId={`${props.tile.id}-first`} tile={props.tile.first} />
      <Splitter.ResizeTrigger
        class="bg-gray-100"
        classList={{
          'h-1': props.tile.direction === TileDirections.Vertical,
          'w-1': props.tile.direction === TileDirections.Horizontal,
        }}
        id={`${props.tile.id}-first:${props.tile.id}-second`}
      />
      <TileNodeView parent={props.tile} panelId={`${props.tile.id}-second`} tile={props.tile.second} />
    </Splitter.Root>
  );

  if (props.panelId) {
    return <Splitter.Panel id={props.panelId!}>{content}</Splitter.Panel>;
  }

  return content;
}

export default function TileNodeView(props: { tile: TileNode; panelId?: string; parent?: TileParent }) {
  const workbench = container.resolve(Workbench);

  return (
    <Show
      when={typeof props.tile !== 'string'}
      fallback={
        <Show when={workbench.getTileById(props.tile as string)}>
          {(tile) => <Tile tile={tile()} panelId={props.panelId} />}
        </Show>
      }
    >
      <TileParentNode panelId={props.panelId} tile={props.tile as TileParent} />
    </Show>
  );
}
