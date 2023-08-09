import { useEffect, useState } from 'react';
import { useDroppable, useDndMonitor, type DragMoveEvent } from '@dnd-kit/core';
import { container } from 'tsyringe';
import throttle from 'lodash/throttle';

import { EntityTypes } from 'model/entity';
import { TileSplitDirections } from 'model/workbench/TileManger';
import type Tile from 'model/workbench/Tile';
import EditorService from 'service/EditorService';
import NoteService from 'service/NoteService';
import EditorView from 'model/abstract/EditorView';

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
  const { moveEditorView: moveEditor, openEntity } = container.resolve(EditorService);
  const { noteTree } = container.resolve(NoteService);
  const [dropPosition, setDropPosition] = useState<Position>();
  const {
    setNodeRef: setDroppableRef,
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
      const draggingItem = active.data.current?.instance;
      const overItem = over?.data.current?.instance;

      if (
        !dropPosition ||
        overItem !== tile ||
        !(draggingItem instanceof EditorView || noteTree.hasNode(draggingItem))
      ) {
        return;
      }

      const direction = Object.keys(dropPosition).find((key) => dropPosition[key as keyof Position] !== '0px');

      if (!direction) {
        if (draggingItem instanceof EditorView) {
          moveEditor(draggingItem, tile);
        } else {
          openEntity({ id: draggingItem.id, type: EntityTypes.Note });
        }
        return;
      }

      const d = directionMap[direction as keyof Position];

      if (draggingItem === (overItem as Tile).currentEditorView) {
        openEntity(draggingItem.editor.toEntityLocator(), { direction: d, from: overItem });
      } else if (draggingItem instanceof EditorView) {
        moveEditor(draggingItem, { from: tile, splitDirection: d });
      } else {
        openEntity({ id: draggingItem.id, type: EntityTypes.Note }, { direction: d, from: overItem });
      }
    },
    onDragMove: throttle(({ active }: DragMoveEvent) => {
      const rect = active.rect.current.translated;
      const instance = active.data.current?.instance;

      if (!isOver || !rect || !editorRect.current || !(instance instanceof EditorView || noteTree.hasNode(instance))) {
        return;
      }

      const portion = 6;
      const position: Position | undefined = { top: '0px', left: '0px', bottom: '0px', right: '0px' };
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
      }

      setDropPosition(position);
    }, 300),
  });

  return { setDroppableRef, isOver, dropPosition };
}
