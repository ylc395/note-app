import type { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import container from '#utils/singletonContainer';
import NoteService from '#domain/client/app/service/NoteService';
import { TileSplitDirections } from '#domain/client/app/model/Workbench';
import type Tile from '#domain/client/app/model/Workbench/Tile';
import BaseEditor from '#domain/client/app/model/note/editor/BaseEditor';

type DropTarget = Parameters<typeof dropTargetForElements>[0];

export default class TileDropTarget implements DropTarget {
  public readonly element: HTMLElement;
  private readonly tile: Tile;
  private readonly onDirectionChange: (direction?: TileSplitDirections | 'middle') => void;
  private readonly workbench = container.resolve(NoteService).workbench;
  private newTileRect: DOMRect | undefined;
  private newTileDirection: TileSplitDirections | 'middle' | undefined;

  constructor({
    tileElement,
    tile,
    onDirectionChange,
  }: {
    tileElement: HTMLElement;
    tile: Tile;
    onDirectionChange: (direction?: TileSplitDirections | 'middle') => void;
  }) {
    this.element = tileElement;
    this.tile = tile;
    this.onDirectionChange = onDirectionChange;
  }

  public readonly onDragLeave = () => {
    this.newTileDirection = undefined;
    this.newTileRect = undefined;
    this.onDirectionChange(undefined);
  };

  public readonly onDragEnter: NonNullable<DropTarget['onDragEnter']> = () => {
    this.newTileRect = this.element.getBoundingClientRect();
  };

  public readonly onDrag: NonNullable<DropTarget['onDrag']> = ({ location }) => {
    if (!this.newTileRect) {
      return;
    }

    const lastDirection = this.newTileDirection;
    const offsetX = location.current.input.clientX - this.newTileRect.left;
    const offsetY = location.current.input.clientY - this.newTileRect.top;

    if (offsetX / this.newTileRect.width <= 0.2) {
      this.newTileDirection = TileSplitDirections.Left;
    } else if (offsetX / this.newTileRect.width >= 0.8) {
      this.newTileDirection = TileSplitDirections.Right;
    } else if (offsetY / this.newTileRect.height <= 0.2) {
      this.newTileDirection = TileSplitDirections.Top;
    } else if (offsetY / this.newTileRect.height >= 0.8) {
      this.newTileDirection = TileSplitDirections.Bottom;
    } else {
      this.newTileDirection = 'middle';
    }

    if (lastDirection !== this.newTileDirection) {
      this.onDirectionChange(this.newTileDirection);
    }
  };

  public readonly onDrop: NonNullable<DropTarget['onDrop']> = ({ source }) => {
    const { newTileDirection } = this;
    this.onDragLeave();

    if (!newTileDirection) {
      return;
    }

    if (source.data instanceof BaseEditor) {
      if (newTileDirection === 'middle') {
        source.data.moveTo(this.tile, true);
      } else {
        this.workbench.splitTileWithEditor(this.tile.id, newTileDirection, source.data);
      }
      return;
    }

    const note = NoteService.getNote(source.data);

    if (note) {
      this.workbench.open(
        note,
        newTileDirection === 'middle' ? this.tile : { splitDirection: newTileDirection, from: this.tile },
      );
    }
  };

  public readonly canDrop: DropTarget['canDrop'] = ({ source }) => {
    if (!NoteService.getNote(source.data)) {
      return false;
    }

    if (source.data instanceof BaseEditor && source.data.tile.editors.length === 1 && source.data.tile === this.tile) {
      return false;
    }

    return true;
  };
}
