import { action } from 'mobx';
import { type MouseEventHandler, useState, useRef, useEffect } from 'react';
import throttle from 'lodash/throttle';
import clamp from 'lodash/clamp';
import mapValues from 'lodash/mapValues';
import clsx from 'clsx';

import { TileDirections, type TileParent, MIN_TILE_WIDTH, MAX_TILE_WIDTH } from 'model/workbench';
import { type BoundingBox, getAbsoluteSplitPercentage, getRelativeSplitPercentage } from './utils';
import { useMemoizedFn } from 'ahooks';

interface Props {
  node: TileParent;
  boundingBox: BoundingBox;
}

// eslint-disable-next-line mobx/missing-observer
export default (function Resizer({ node, boundingBox }: Props) {
  const position = node.direction === TileDirections.Vertical ? 'top' : 'left';
  const [isResizing, setIsResizing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const updateNode = useMemoizedFn(
    throttle(
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
    ),
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
      className={clsx(
        'absolute z-10 bg-gray-100 hover:bg-blue-100',
        node.direction === TileDirections.Vertical
          ? 'h-[2px] cursor-row-resize hover:h-1'
          : 'w-[2px] cursor-col-resize hover:w-1',
      )}
      style={{
        ...mapValues(boundingBox, (v) => `${v}%`),
        [position]: `${getAbsoluteSplitPercentage(boundingBox, node)}%`,
      }}
    />
  );
});
