import type { BaseEventPayload, ElementDragType } from '@atlaskit/pragmatic-drag-and-drop/types';

import { container } from '#domain/shared/infra/singletons';
import NoteService from '#domain/client/app/service/NoteService';
import { TileSplitDirections } from '#domain/client/app/model/Workbench';
import type Tile from '#domain/client/app/model/Workbench/Tile';
import type { NoteVO } from '#domain/shared/model/note';
import BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';

export default function dragHandler({
  tileElement,
  tile,
  onDirectionChange,
}: {
  tileElement: HTMLElement;
  tile: Tile;
  onDirectionChange: (direction?: TileSplitDirections | 'middle') => void;
}) {
  let tileRect: DOMRect | undefined;
  let note: NoteVO | undefined;
  let tileDirection: TileSplitDirections | 'middle' | undefined;
  const { workbench } = container.resolve(NoteService);

  function onDragLeave() {
    note = undefined;
    tileDirection = undefined;
    tileRect = undefined;
    onDirectionChange(undefined);
  }

  function onDragEnter({ source }: BaseEventPayload<ElementDragType>) {
    tileRect = tileElement.getBoundingClientRect();
    note = NoteService.getNote(source.data);
  }

  function onDrag({ location }: BaseEventPayload<ElementDragType>) {
    if (!note || !tileRect) {
      return;
    }

    const lastDirection = tileDirection;
    const offsetX = location.current.input.clientX - tileRect.left;
    const offsetY = location.current.input.clientY - tileRect.top;

    if (offsetX / tileRect.width <= 0.2) {
      tileDirection = TileSplitDirections.Left;
    } else if (offsetX / tileRect.width >= 0.8) {
      tileDirection = TileSplitDirections.Right;
    } else if (offsetY / tileRect.height <= 0.2) {
      tileDirection = TileSplitDirections.Top;
    } else if (offsetY / tileRect.height >= 0.8) {
      tileDirection = TileSplitDirections.Bottom;
    } else {
      tileDirection = 'middle';
    }

    if (lastDirection !== tileDirection) {
      onDirectionChange(tileDirection);
    }
  }

  function onDrop({ source }: BaseEventPayload<ElementDragType>) {
    const _note = note;
    const _tileDirection = tileDirection;

    onDragLeave();

    if (!_tileDirection) {
      return;
    }

    if (source.data instanceof BaseEditor) {
      if (_tileDirection === 'middle') {
        source.data.moveTo(tile);
      }
      return;
    }

    if (_note) {
      workbench.open(_note, _tileDirection === 'middle' ? tile : { splitDirection: _tileDirection, from: tile });
    }
  }

  return { element: tileElement, onDragEnter, onDrag, onDrop, onDragLeave };
}
