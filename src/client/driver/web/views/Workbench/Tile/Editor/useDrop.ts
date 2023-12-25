import { useMemoizedFn } from 'ahooks';
import { useState } from 'react';
import { container } from 'tsyringe';

import { type Tile, TileSplitDirections } from '@domain/app/model/workbench';
import ExplorerManager from '@domain/app/model/manager/ExplorerManager';
import Editor from '@domain/app/model/abstract/Editor';
import { Workbench } from '@domain/app/model/workbench';
import TreeNode from '@domain/common/model/abstract/TreeNode';

interface Position {
  top: string;
  bottom: string;
  left: string;
  right: string;
}

const directionMap = {
  top: TileSplitDirections.Down,
  bottom: TileSplitDirections.Up,
  left: TileSplitDirections.Right,
  right: TileSplitDirections.Left,
};

export default function useDrop(tile: Tile) {
  const { moveEditor, openEntity } = container.resolve(Workbench);
  const [dropArea, setDropArea] = useState<Position>();

  const onDrop = useMemoizedFn((item: unknown) => {
    const direction = dropArea
      ? (Object.keys(dropArea).find((key) => dropArea[key as keyof Position] !== '0px') as keyof Position | undefined)
      : undefined;

    if (!direction) {
      return;
    }

    if (item instanceof Editor) {
      moveEditor(item, { from: tile, splitDirection: directionMap[direction] });
    }

    if (item instanceof TreeNode) {
      openEntity(item.toEntityLocator(), { from: tile, splitDirection: directionMap[direction] });
    }
  });

  const onDragMove = useMemoizedFn(({ cursor, dropRect }: { cursor: { x: number; y: number }; dropRect: DOMRect }) => {
    const portion = 6;
    const position: Position = { top: '0px', left: '0px', bottom: '0px', right: '0px' };
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
    }

    setDropArea(position);
  });

  return { onDrop, onDragMove, dropArea };
}
