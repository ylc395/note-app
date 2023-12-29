import { useMemoizedFn } from 'ahooks';
import { useEffect, useState } from 'react';
import { container } from 'tsyringe';

import { type Tile, TileSplitDirections } from '@domain/app/model/workbench';
import Editor from '@domain/app/model/abstract/Editor';
import { Workbench } from '@domain/app/model/workbench';

interface Position {
  top: string;
  bottom: string;
  left: string;
  right: string;
}

const directionMap = {
  top: TileSplitDirections.Bottom,
  bottom: TileSplitDirections.Top,
  left: TileSplitDirections.Right,
  right: TileSplitDirections.Left,
};

export default function useDrop(tile: Tile) {
  const { moveEditor } = container.resolve(Workbench);
  const [dropArea, setDropArea] = useState<Position>();
  const [isOver, setIsOver] = useState(false);

  const onDrop = useMemoizedFn((item: unknown) => {
    const direction = dropArea
      ? (Object.keys(dropArea).find((key) => dropArea[key as keyof Position] !== '0px') as keyof Position | undefined)
      : undefined;

    if (item instanceof Editor) {
      if (!direction && tile === item.tile) {
        return;
      }

      moveEditor(item, direction ? { from: tile, splitDirection: directionMap[direction] } : tile);
    }
  });

  const onDragMove = useMemoizedFn(
    ({ cursor, dropRect, item }: { item: unknown; cursor: { x: number; y: number }; dropRect: DOMRect }) => {
      if (!(item instanceof Editor)) {
        return;
      }

      const portion = 6;
      let position: Position | undefined = { top: '0px', left: '0px', bottom: '0px', right: '0px' };
      const isInLeftBoundary = cursor.x - dropRect.left < dropRect.width / portion;
      const isInRightBoundary = dropRect.right - cursor.x < dropRect.width / portion;
      const isInTopBoundary = cursor.y - dropRect.top < dropRect.height / portion;
      const isInBottomBoundary = dropRect.bottom - cursor.y < dropRect.height / portion;

      if (isInLeftBoundary && !isInTopBoundary && !isInBottomBoundary) {
        position.right = `${dropRect.width / 2}px`;
      } else if (isInRightBoundary && !isInTopBoundary && !isInBottomBoundary) {
        position.left = `${dropRect.width / 2}px`;
      } else if (isInTopBoundary && !isInLeftBoundary && !isInRightBoundary) {
        position.bottom = `${dropRect.height / 2}px`;
      } else if (isInBottomBoundary && !isInLeftBoundary && !isInRightBoundary) {
        position.top = `${dropRect.height / 2}px`;
      } else if (item.tile === tile) {
        position = undefined;
      }

      setDropArea(position);
    },
  );

  useEffect(() => {
    if (!isOver) {
      setDropArea(undefined);
    }
  }, [isOver]);

  return { onDrop, onDragMove, dropArea, setIsOver };
}
