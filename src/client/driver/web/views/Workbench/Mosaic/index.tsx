import type { ReactNode } from 'react';
import { observer } from 'mobx-react-lite';

import type Tile from 'model/workbench/Tile';
import type { TileNode } from 'model/workbench/TileManger';
import TileView from './TileView';

interface Props {
  root?: TileNode;
  renderTile: (tileId: Tile['id']) => ReactNode;
  children: ReactNode;
}

export default observer(function Mosaic({ root, renderTile, children }: Props) {
  if (!root) {
    return <>{children}</>;
  }

  return (
    <div className="relative h-full w-full">
      <TileView boundingBox={{ top: 0, right: 0, bottom: 0, left: 0 }} node={root} renderTile={renderTile} />
    </div>
  );
});
