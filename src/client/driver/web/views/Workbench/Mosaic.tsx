import type { ReactNode, FC } from 'react';
import { observer } from 'mobx-react-lite';

import type Tile from 'model/workbench/Tile';
import { type TileNode, isTileId, TileDirections } from 'model/workbench/TileManger';
import mapValues from 'lodash/mapValues';

interface BoundingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

function getAbsoluteSplitPercentage(
  boundingBox: BoundingBox,
  relativeSplitPercentage: number,
  direction: TileDirections,
) {
  const { top, right, bottom, left } = boundingBox;
  if (direction === TileDirections.Vertical) {
    const height = 100 - top - bottom;
    return (height * relativeSplitPercentage) / 100 + top;
  } else {
    const width = 100 - right - left;
    return (width * relativeSplitPercentage) / 100 + left;
  }
}

function split(boundingBox: BoundingBox, direction: TileDirections, relativeSplitPercentage = 50) {
  const absolutePercentage = getAbsoluteSplitPercentage(boundingBox, relativeSplitPercentage, direction);

  return {
    first: { ...boundingBox, [direction === TileDirections.Vertical ? 'bottom' : 'right']: 100 - absolutePercentage },
    second: { ...boundingBox, [direction === TileDirections.Vertical ? 'top' : 'left']: absolutePercentage },
  };
}

const TileView: FC<{ node: TileNode; renderTile: Props['renderTile']; boundingBox: BoundingBox }> = observer(
  ({ node, renderTile, boundingBox }) => {
    if (isTileId(node)) {
      return (
        <div className="absolute" style={mapValues(boundingBox, (v) => `${v}%`)}>
          {renderTile(node)}
        </div>
      );
    }

    const { first, second } = split(boundingBox, node.direction, node.splitPercentage);

    return (
      <>
        <TileView boundingBox={first} node={node.first} renderTile={renderTile}></TileView>
        <TileView boundingBox={second} node={node.second} renderTile={renderTile}></TileView>
      </>
    );
  },
);

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
