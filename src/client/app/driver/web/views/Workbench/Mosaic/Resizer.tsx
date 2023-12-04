import { action } from 'mobx';
import { useRef } from 'react';
import throttle from 'lodash/throttle';
import clamp from 'lodash/clamp';
import mapValues from 'lodash/mapValues';

import { TileDirections, type TileParent } from '@domain/model/workbench';
import BaseResizer from '@components/Resizable/Resizer';
import { type BoundingBox, getAbsoluteSplitPercentage, getRelativeSplitPercentage } from './utils';

interface Props {
  node: TileParent;
  boundingBox: BoundingBox;
}

export const MAX_TILE_WIDTH = 100;
export const MIN_TILE_WIDTH = 20;

// eslint-disable-next-line mobx/missing-observer
export default (function Resizer({ node, boundingBox }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const updateNode = throttle(
    action((e: MouseEvent) => {
      const { direction } = node;
      const parentBoundingBox = ref.current!.parentElement!.getBoundingClientRect();

      let absolutePercentage: number;
      if (direction === TileDirections.Vertical) {
        absolutePercentage = ((e.clientY - parentBoundingBox.top) / parentBoundingBox.height) * 100.0;
      } else {
        absolutePercentage = ((e.clientX - parentBoundingBox.left) / parentBoundingBox.width) * 100.0;
      }

      const relativePercentage = getRelativeSplitPercentage(boundingBox, absolutePercentage, direction);

      node.splitPercentage = clamp(relativePercentage, MIN_TILE_WIDTH, MAX_TILE_WIDTH - MIN_TILE_WIDTH);
    }),
    1000 / 30,
  );

  return (
    <BaseResizer
      ref={ref}
      className="absolute z-10"
      direction={node.direction === TileDirections.Vertical ? 'y' : 'x'}
      onResize={updateNode}
      style={{
        ...mapValues(boundingBox, (v) => `${v}%`),
        [node.direction === TileDirections.Vertical ? 'top' : 'left']: `${getAbsoluteSplitPercentage(
          boundingBox,
          node,
        )}%`,
      }}
    />
  );
});
