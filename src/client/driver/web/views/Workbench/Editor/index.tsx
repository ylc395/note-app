import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { useDroppable, useDndMonitor, type DragMoveEvent } from '@dnd-kit/core';
import throttle from 'lodash/throttle';

import type Tile from 'model/workbench/Tile';
import NoteEditor from 'model/note/Editor';
import EntityEditor from 'model/abstract/Editor';

import EditorService from 'service/EditorService';

import NoteEditorView from './NoteEditor';
import { useEffect, useState } from 'react';
import { TileSplitDirections } from 'model/workbench/TileManger';

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

export default observer(function Editor({ tileId }: { tileId: Tile['id'] }) {
  const { tileManager, moveEditor } = container.resolve(EditorService);
  const tile = tileManager.getTile(tileId);

  const [dropPosition, setDropPosition] = useState<Position>();
  const {
    setNodeRef,
    isOver,
    rect: editorRect,
  } = useDroppable({
    id: `${tileId}-editor`,
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
      const position: Position = { top: '0px', left: '0px', bottom: '0px', right: '0px' };
      const isInLeftBoundary = rect.left - editorRect.current.left < editorRect.current.width / portion;
      const isInRightBoundary = editorRect.current.right - rect.right < editorRect.current.width / portion;
      const isInTopBoundary = rect.top - editorRect.current.top < editorRect.current.height / portion;
      const isInBottomBoundary = editorRect.current.bottom - rect.bottom < editorRect.current.height / portion;

      if (isInLeftBoundary && !isInTopBoundary && !isInBottomBoundary) {
        position.right = `${editorRect.current.width / 2}px`;
      }

      if (isInRightBoundary && !isInTopBoundary && !isInBottomBoundary) {
        position.left = `${editorRect.current.width / 2}px`;
      }

      if (isInTopBoundary && !isInLeftBoundary && !isInRightBoundary) {
        position.bottom = `${editorRect.current.height / 2}px`;
      }

      if (isInBottomBoundary && !isInLeftBoundary && !isInRightBoundary) {
        position.top = `${editorRect.current.height / 2}px`;
      }

      setDropPosition(position);
    }, 300),
  });

  return (
    <div ref={setNodeRef} className="relative min-h-0 shrink grow">
      {tile.currentEditor instanceof NoteEditor && <NoteEditorView editor={tile.currentEditor} />}
      {isOver ? <div className="absolute bg-blue-50 opacity-60" style={dropPosition} /> : null}
    </div>
  );
});
