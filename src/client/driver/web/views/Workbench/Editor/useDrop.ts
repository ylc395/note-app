import { useEffect, useState } from 'react';
import { useDroppable, useDndMonitor, type DragMoveEvent } from '@dnd-kit/core';
import { container } from 'tsyringe';
import throttle from 'lodash/throttle';

import { TileSplitDirections } from 'model/workbench/TileManger';
import type Tile from 'model/workbench/Tile';
import EntityEditor from 'model/abstract/Editor';
import EditorService from 'service/EditorService';

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
  const { moveEditor } = container.resolve(EditorService);
  const [dropPosition, setDropPosition] = useState<Position>();
  const {
    setNodeRef,
    isOver,
    rect: editorRect,
  } = useDroppable({
    id: `${tile.id}-editor`,
    data: { instance: tile },
  });

  useEffect(() => {
    if (!isOver) {
      setDropPosition(undefined);
    }
  }, [isOver]);

  useDndMonitor({
    onDragEnd({ over, active }) {
      if (
        !dropPosition ||
        over?.data.current?.instance !== tile ||
        !(active.data.current?.instance instanceof EntityEditor)
      ) {
        return;
      }

      const direction = Object.keys(dropPosition).find((key) => dropPosition[key as keyof Position] !== '0px');

      if (!direction) {
        moveEditor(active.data.current.instance, tile);
      } else {
        moveEditor(active.data.current.instance, {
          from: tile,
          splitDirection: directionMap[direction as keyof Position],
        });
      }
    },
    onDragMove: throttle(({ active }: DragMoveEvent) => {
      const rect = active.rect.current.translated;
      const instance = active.data.current?.instance;

      if (
        !isOver ||
        !rect ||
        !editorRect.current ||
        !(instance instanceof EntityEditor) ||
        (instance.isOnlyOne && instance.tile === tile)
      ) {
        return;
      }

      const portion = 6;
      let position: Position | undefined = { top: '0px', left: '0px', bottom: '0px', right: '0px' };
      const isInLeftBoundary = rect.left - editorRect.current.left < editorRect.current.width / portion;
      const isInRightBoundary = editorRect.current.right - rect.right < editorRect.current.width / portion;
      const isInTopBoundary = rect.top - editorRect.current.top < editorRect.current.height / portion;
      const isInBottomBoundary = editorRect.current.bottom - rect.bottom < editorRect.current.height / portion;

      if (isInLeftBoundary && !isInTopBoundary && !isInBottomBoundary) {
        position.right = `${editorRect.current.width / 2}px`;
      } else if (isInRightBoundary && !isInTopBoundary && !isInBottomBoundary) {
        position.left = `${editorRect.current.width / 2}px`;
      } else if (isInTopBoundary && !isInLeftBoundary && !isInRightBoundary) {
        position.bottom = `${editorRect.current.height / 2}px`;
      } else if (isInBottomBoundary && !isInLeftBoundary && !isInRightBoundary) {
        position.top = `${editorRect.current.height / 2}px`;
      } else if (instance.tile === tile) {
        position = undefined;
      }

      setDropPosition(position);
    }, 300),
  });

  return { setNodeRef, isOver, dropPosition };
}
