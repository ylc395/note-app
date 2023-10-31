import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { type MouseEventHandler, useState, useRef, useEffect } from 'react';
import throttle from 'lodash/throttle';
import clamp from 'lodash/clamp';
import mapValues from 'lodash/mapValues';

import { TileDirections, type TileParent, MIN_TILE_WIDTH, MAX_TILE_WIDTH } from 'model/workbench/TileManger';
import { type BoundingBox, getAbsoluteSplitPercentage, getRelativeSplitPercentage } from './utils';
import { useMemoizedFn } from 'ahooks';

interface Props {
  node: TileParent;
  boundingBox: BoundingBox;
}

export default observer(({ node, boundingBox }: Props) => {
  const position = node.direction === TileDirections.Vertical ? 'top' : 'left';
  const [isResizing, setIsResizing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const updateNode = useMemoizedFn(
    throttle((e: MouseEvent) => {
      const { direction } = node;
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
  );

  const onMouseDown = useMemoizedFn<MouseEventHandler>((e) => {
    if (e.button !== 0) {
      return;
    }
    e.preventDefault();
    const parentEl = ref.current!.parentElement!;
    parentEl.classList.add(node.direction === TileDirections.Vertical ? 'cursor-row-resize' : 'cursor-col-resize');
    setIsResizing(true);
  });

  useEffect(() => {
    const onMousemove = (e: MouseEvent) => {
      if (!isResizing) {
        return;
      }

      e.preventDefault();
      updateNode(e);
    };
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
