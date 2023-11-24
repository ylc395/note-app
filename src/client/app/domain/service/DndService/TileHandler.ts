import { container } from 'tsyringe';
import { observable, makeObservable, action, computed } from 'mobx';

import { Tile, TileSplitDirections, Workbench } from 'model/workbench';
import Explorer from 'model/Explorer';
import Editor from 'model/abstract/Editor';

import type { default as Handler, DragMoveEvent } from './Handler';

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

export default class TileHandler implements Handler {
  constructor() {
    makeObservable(this);
  }
  private readonly explorer = container.resolve(Explorer);
  private readonly workbench = container.resolve(Workbench);

  @observable.ref
  dropAreaPosition?: Position;

  @observable.ref
  private targetTile?: Tile;

  @computed
  get targetTileId() {
    return this.targetTile?.id;
  }

  @action.bound
  handleDragMove(draggingItem: unknown, over: unknown, { draggingItemRect, overRect }: DragMoveEvent) {
    if (!(over instanceof Tile) || !overRect) {
      return;
    }

    if (!(draggingItem instanceof Editor) && !this.explorer.isTreeNode(draggingItem)) {
      return;
    }

    this.targetTile = over;

    const portion = 6;
    const position: Position = { top: '0px', left: '0px', bottom: '0px', right: '0px' };
    const isInLeftBoundary = draggingItemRect.left - overRect.left < overRect.width / portion;
    const isInRightBoundary = overRect.right - draggingItemRect.right < overRect.width / portion;
    const isInTopBoundary = draggingItemRect.top - overRect.top < overRect.height / portion;
    const isInBottomBoundary = overRect.bottom - draggingItemRect.bottom < overRect.height / portion;

    if (isInLeftBoundary && !isInTopBoundary && !isInBottomBoundary) {
      position.right = `${overRect.width / 2}px`;
    } else if (isInRightBoundary && !isInTopBoundary && !isInBottomBoundary) {
      position.left = `${overRect.width / 2}px`;
    } else if (isInTopBoundary && !isInLeftBoundary && !isInRightBoundary) {
      position.bottom = `${overRect.height / 2}px`;
    } else if (isInBottomBoundary && !isInLeftBoundary && !isInRightBoundary) {
      position.top = `${overRect.height / 2}px`;
    }

    this.dropAreaPosition = position;
  }

  handleDrop(draggingItem: unknown, dropTarget: unknown) {
    const { dropAreaPosition } = this;

    if (dropAreaPosition) {
      this.dropAreaPosition = undefined;
    }

    if (!dropAreaPosition || !(dropTarget instanceof Tile)) {
      return;
    }

    const direction = Object.keys(dropAreaPosition).find((key) => dropAreaPosition[key as keyof Position] !== '0px') as
      | keyof Position
      | undefined;

    const newTile = direction ? { splitDirection: directionMap[direction], from: dropTarget } : undefined;

    if (draggingItem instanceof Editor) {
      this.workbench.moveEditor(draggingItem, newTile || dropTarget);
    } else if (this.explorer.isTreeNode(draggingItem)) {
      this.workbench.openEntity(this.explorer.treeNodeToEntityLocator(draggingItem), newTile || dropTarget);
    }
  }

  handleCancel(): void {
    if (this.dropAreaPosition) {
      this.dropAreaPosition = undefined;
    }
  }
}
