import { useMemoizedFn } from 'ahooks';
import { useEffect, useState } from 'react';
import { container } from 'tsyringe';

import { type Tile, TileSplitDirections } from '@domain/app/model/workbench';
import Editor from '@domain/app/model/abstract/Editor';
import { Workbench } from '@domain/app/model/workbench';
import TreeNode from '@domain/common/model/abstract/TreeNode';
import { isMatch } from 'lodash-es';

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
  const { moveEditor, openEntity } = container.resolve(Workbench);
  const [dropArea, setDropArea] = useState<Position>();
  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);

  const onDrop = useMemoizedFn((item: unknown) => {
    if (!canDrop) {
      return;
    }

    const direction = dropArea
      ? (Object.keys(dropArea).find((key) => dropArea[key as keyof Position] !== '0px') as keyof Position | undefined)
      : undefined;
    const dest = direction ? { from: tile, splitDirection: directionMap[direction] } : tile;

    if (item instanceof Editor) {
      moveEditor(item, dest);
    }

    if (item instanceof TreeNode) {
      openEntity(item.entityLocator, { dest, forceNewTab: true });
    }
  });

  const onDragMove = useMemoizedFn(
    ({ cursor, dropRect, item }: { item: unknown; cursor: { x: number; y: number }; dropRect: DOMRect }) => {
      setCanDrop(false);
      if (!(item instanceof Editor) && !(item instanceof TreeNode)) {
        return;
      }

      if (item instanceof Editor && item.tile === tile && tile.editors.length === 1) {
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
      } else if (isMatch(item.entityLocator, tile.currentEditor?.entityLocator || {})) {
        position = undefined;
      }

      setCanDrop(Boolean(position));
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
