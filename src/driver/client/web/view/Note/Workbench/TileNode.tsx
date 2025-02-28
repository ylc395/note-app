import { Splitter } from '@ark-ui/solid';

import { TileDirections, type TileNode } from '#domain/client/app/model/Workbench/tileTree';
import { container } from '#domain/shared/infra/singletons';
import Workbench from '#domain/client/app/model/Workbench';

import Tile from './Tile';

export default function TileNodeView(props: { tile: TileNode; panelId?: string }) {
  const workbench = container.resolve(Workbench);
  const tileNode = props.tile;

  if (typeof tileNode === 'string') {
    const tile = workbench.getTileById(tileNode);

    return <Tile tile={tile} panelId={props.panelId} />;
  }

  return (
    <Splitter.Panel id={props.panelId!}>
      <Splitter.Root orientation={tileNode.direction === TileDirections.Horizontal ? 'horizontal' : 'vertical'}>
        <TileNodeView panelId={`${tileNode.id}-first`} tile={tileNode.first} />
        <Splitter.ResizeTrigger id={`${tileNode.id}-first:${tileNode.id}-second`} />
        <TileNodeView panelId={`${tileNode.id}-second`} tile={tileNode.second} />
      </Splitter.Root>
    </Splitter.Panel>
  );
}
