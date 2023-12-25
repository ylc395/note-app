import { DndProvider, useDragDropManager, useDragLayer } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { ReactNode } from 'react';

// eslint-disable-next-line mobx/missing-observer
export default function DraggableZone({ children }: { children: ReactNode }) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}
