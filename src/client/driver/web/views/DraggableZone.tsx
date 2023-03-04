import { DndContext, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { ReactNode } from 'react';

// eslint-disable-next-line mobx/missing-observer
export default (function DraggableZone({ children }: { children: ReactNode }) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
  );

  return <DndContext sensors={sensors}>{children}</DndContext>;
});
