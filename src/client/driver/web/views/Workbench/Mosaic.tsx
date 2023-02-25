import { type ReactNode, type FC, useCallback, type MouseEventHandler, useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import throttle from 'lodash/throttle';
import clamp from 'lodash/clamp';

import type Tile from 'model/workbench/Tile';
import {
  type TileNode,
  isTileLeaf,
  TileDirections,
  TileParent,
  MIN_TILE_WIDTH,
  MAX_TILE_WIDTH,
} from 'model/workbench/TileManger';
import mapValues from 'lodash/mapValues';
import { runInAction } from 'mobx';

interface BoundingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

function getAbsoluteSplitPercentage(boundingBox: BoundingBox, node: TileParent) {
  const { top, right, bottom, left } = boundingBox;
  const { direction, splitPercentage = 50 } = node;
  if (direction === TileDirections.Vertical) {
    const height = 100 - top - bottom;
    return (height * splitPercentage) / 100 + top;
  } else {
    const width = 100 - right - left;
    return (width * splitPercentage) / 100 + left;
  }
}

function getRelativeSplitPercentage(
  boundingBox: BoundingBox,
  absoluteSplitPercentage: number,
  direction: TileDirections,
) {
  const { top, right, bottom, left } = boundingBox;
  if (direction === TileDirections.Vertical) {
    const height = 100 - top - bottom;
    return ((absoluteSplitPercentage - top) / height) * 100;
  } else {
    const width = 100 - right - left;
    return ((absoluteSplitPercentage - left) / width) * 100;
  }
}

function split(boundingBox: BoundingBox, node: TileParent) {
  const absolutePercentage = getAbsoluteSplitPercentage(boundingBox, node);
  const { direction } = node;

  return {
    first: { ...boundingBox, [direction === TileDirections.Vertical ? 'bottom' : 'right']: 100 - absolutePercentage },
    second: { ...boundingBox, [direction === TileDirections.Vertical ? 'top' : 'left']: absolutePercentage },
  };
}

const TileView: FC<{ node: TileNode; renderTile: Props['renderTile']; boundingBox: BoundingBox }> = observer(
  ({ node, renderTile, boundingBox }) => {
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
  },
);

const Resizer: FC<{ node: TileParent; boundingBox: BoundingBox }> = observer(({ node, boundingBox }) => {
  const position = node.direction === TileDirections.Vertical ? 'top' : 'left';
  const [isResizing, setIsResizing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateNode = useCallback(
    throttle((e: MouseEvent) => {
      const { direction } = node;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parentBoundingBox = ref.current!.parentElement!.getBoundingClientRect();

      let absolutePercentage: number;
      if (direction === TileDirections.Vertical) {
        absolutePercentage = ((e.clientY - parentBoundingBox.top) / parentBoundingBox.height) * 100.0;
      } else {
        absolutePercentage = ((e.clientX - parentBoundingBox.left) / parentBoundingBox.width) * 100.0;
      }

      const relativePercentage = getRelativeSplitPercentage(boundingBox, absolutePercentage, direction);

      runInAction(() => {
        node.splitPercentage = clamp(relativePercentage, MIN_TILE_WIDTH, MAX_TILE_WIDTH - MIN_TILE_WIDTH);
      });
    }, 1000 / 30),
    [node, boundingBox],
  );
  const onMouseDown = useCallback<MouseEventHandler>(
    (e) => {
      if (e.button !== 0) {
        return;
      }
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parentEl = ref.current!.parentElement!;
      parentEl.classList.add(node.direction === TileDirections.Vertical ? 'cursor-row-resize' : 'cursor-col-resize');
      setIsResizing(true);
    },
    [node.direction],
  );

  useEffect(() => {
    const onMousemove = (e: MouseEvent) => {
      if (!isResizing) {
        return;
      }

      e.preventDefault();
      updateNode(e);
    };
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parentEl = ref.current!.parentElement!;
    const onMouseUp = () => {
      parentEl.classList.remove(node.direction === TileDirections.Vertical ? 'cursor-row-resize' : 'cursor-col-resize');
      setIsResizing(false);
    };

    parentEl.addEventListener('mousemove', onMousemove);
    parentEl.addEventListener('mouseup', onMouseUp);

    return () => {
      parentEl.removeEventListener('mousemove', onMousemove);
      parentEl.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, updateNode, node.direction]);

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      className={`absolute z-10 bg-red-300 ${
        node.direction === TileDirections.Vertical ? 'h-2 cursor-row-resize' : 'w-2 cursor-col-resize'
      }`}
      style={{
        ...mapValues(boundingBox, (v) => `${v}%`),
        [position]: `${getAbsoluteSplitPercentage(boundingBox, node)}%`,
      }}
    />
  );
});

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
