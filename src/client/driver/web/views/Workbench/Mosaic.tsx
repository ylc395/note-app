import type { ReactNode, FC } from 'react';
import { observer } from 'mobx-react-lite';

import type Tile from 'model/workbench/Tile';
import { type TileNode, isTileId } from 'model/workbench/TileManger';

interface Props {
  root?: TileNode;
  renderTile: (tileId: Tile['id']) => ReactNode;
  children: ReactNode;
}

const TileView: FC<{ node: TileNode; renderTile: Props['renderTile'] }> = observer(({ node, renderTile }) => {
  return isTileId(node) ? (
    <div className="absolute">{renderTile(node)}</div>
  ) : (
    <>
      <TileView node={node.first} renderTile={renderTile}></TileView>
      <TileView node={node.second} renderTile={renderTile}></TileView>
    </>
  );
});

export default observer(function Mosaic({ root, renderTile, children }: Props) {
  if (!root) {
    return <>{children}</>;
  }

  return (
    <div className="relative h-full w-full">
      <TileView node={root} renderTile={renderTile} />
    </div>
  );
});
