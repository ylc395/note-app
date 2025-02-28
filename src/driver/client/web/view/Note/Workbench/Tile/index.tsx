import { Splitter } from '@ark-ui/solid';
import type Tile from '#domain/client/app/model/Workbench/Tile';
import Tabs from './Tabs';

export default function TileView(props: { tile: Tile; panelId?: string }) {
  const content = (
    <>
      <Tabs tile={props.tile} />
      {props.tile.id}
    </>
  );

  if (props.panelId) {
    return <Splitter.Panel id={props.panelId}>{content}</Splitter.Panel>;
  }

  return <div>{content}</div>;
}
