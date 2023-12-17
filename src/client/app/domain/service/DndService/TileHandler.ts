import { container, singleton } from 'tsyringe';
import { observable, makeObservable, action, computed } from 'mobx';

import { Tile, TileSplitDirections, Workbench } from '@domain/model/workbench';
import Explorer from '@domain/model/Explorer';
import Editor from '@domain/model/abstract/Editor';

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

@singleton()
export default class TileHandler implements Handler {
  constructor() {
    makeObservable(this);
  }
  private readonly explorer = container.resolve(Explorer);
  private readonly workbench = container.resolve(Workbench);

  @observable.ref
  dropArea?: Position;

  @observable.ref
  private targetTile?: Tile;

  @computed
  get targetTileId() {
    return this.targetTile?.id;
  }

  private dropAreaEnabled = true;

  @action
  handleDragMove(draggingItem: unknown, over: unknown, event: DragMoveEvent) {
    if (!(over instanceof Tile)) {
      return;
    }

    if (!(draggingItem instanceof Editor) && !this.explorer.isTreeNode(draggingItem)) {
      return;
    }

    if (this.workbench.hasOnlyOneEditor && draggingItem instanceof Editor) {
      return;
    }

    this.targetTile = over;
    this.updateDropArea(event);
  }

  @action
  private updateDropArea({ draggingItemRect, overRect }: DragMoveEvent) {
    if (!overRect || !this.dropAreaEnabled) {
      return;
    }

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

    this.dropArea = position;
  }

  @action
  handleDrop(draggingItem: unknown, dropTarget: unknown) {
    const { dropArea } = this;

    if (dropArea) {
      this.dropArea = undefined;
    }

    if (!(dropTarget instanceof Tile)) {
      return;
    }

    const direction = dropArea
      ? (Object.keys(dropArea).find((key) => dropArea[key as keyof Position] !== '0px') as keyof Position | undefined)
      : undefined;

    const newTile = direction ? { splitDirection: directionMap[direction], from: dropTarget } : undefined;

    if (draggingItem instanceof Editor) {
      this.workbench.moveEditor(draggingItem, newTile || dropTarget);
    } else if (this.explorer.isTreeNode(draggingItem)) {
      this.workbench.openEntity(this.explorer.treeNodeToEntityLocator(draggingItem), newTile || dropTarget);
    }
  }

  @action.bound
  toggleDropAreaEnabled(value: boolean) {
    this.dropAreaEnabled = value;

    if (!value) {
      this.dropArea = undefined;
    }
  }

  handleCancel(): void {
    this.dropArea = undefined;
  }
}
