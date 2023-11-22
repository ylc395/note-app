interface Rect {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface DragMoveEvent {
  draggingItemRect: Rect;
  overRect?: Rect;
}

export default interface Handler {
  handleDragStart?(draggingItem: unknown): void;
  handleCancel?(draggingItem: unknown): void;
  handleDragOver?(draggingItem: unknown, over: unknown): void;
  handleDragMove?(draggingItem: unknown, over: unknown, event: DragMoveEvent): void;
  handleDrop?(draggingItem: unknown, dropTarget: unknown, extra?: Record<string, unknown>): Promise<void> | void;
  transformItem?(draggingItem: unknown): unknown;
}
