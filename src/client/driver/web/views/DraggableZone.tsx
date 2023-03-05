import { DndContext, MouseSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core';
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

  return (
    // todo: compose detection algorithms
    // https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#pointer-within
    <DndContext sensors={sensors} collisionDetection={pointerWithin}>
      {children}
    </DndContext>
  );
});
