import type { ReactNode } from 'react';
import { mapValues } from 'lodash-es';
import { observer } from 'mobx-react-lite';

import type Tile from '@domain/app/model/workbench/Tile';
import { type TileNode, type TileParent, TileDirections, isTileLeaf } from '@domain/app/model/workbench';

import { type BoundingBox, getAbsoluteSplitPercentage } from './utils';
import Resizer from './Resizer';

function split(boundingBox: BoundingBox, node: TileParent) {
  const absolutePercentage = getAbsoluteSplitPercentage(boundingBox, node);
  const { direction } = node;

  return {
    first: { ...boundingBox, [direction === TileDirections.Vertical ? 'bottom' : 'right']: 100 - absolutePercentage },
    second: { ...boundingBox, [direction === TileDirections.Vertical ? 'top' : 'left']: absolutePercentage },
  };
}

const TileView = observer(function _TileView({
  node,
  renderTile,
  boundingBox,
}: {
  node: TileNode;
  renderTile: (tileId: Tile['id']) => ReactNode;
  boundingBox: BoundingBox;
}) {
  if (isTileLeaf(node)) {
    return (
      <div className="absolute" style={mapValues(boundingBox, (v) => `${v}%`)}>
        {renderTile(node)}
      </div>
    );
  }

  const { first, second } = split(boundingBox, node);

  return (
    <>
      <TileView key={`${node.id}-first-tile`} boundingBox={first} node={node.first} renderTile={renderTile} />
      <Resizer key={`${node.id}-resizer`} boundingBox={boundingBox} node={node} />
      <TileView key={`${node.id}-second-tile`} boundingBox={second} node={node.second} renderTile={renderTile} />
    </>
  );
});

export default TileView;
