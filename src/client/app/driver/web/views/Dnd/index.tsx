import { container } from 'tsyringe';
import { DndContext, MouseSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core';
import type { ReactNode } from 'react';

import DndService from '@domain/service/DndService';
import DraggingPreview from './DraggingPreview';

// eslint-disable-next-line mobx/missing-observer
export default function DraggableZone({ children }: { children: ReactNode }) {
  const { setDraggingItem, setDropTarget, cancelDragging, handleDragOver, handleDragMove } =
    container.resolve(DndService);
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor);

  return (
    // todo: compose detection algorithms
    // https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms#pointer-within
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={(e) => setDraggingItem(e.active.data.current?.instance)}
      onDragCancel={cancelDragging}
      onDragOver={(e) => handleDragOver(e.over?.data.current?.instance)}
      onDragEnd={(e) => setDropTarget(e.over?.data.current?.instance)}
      onDragMove={(e) =>
        handleDragMove(e.over?.data.current?.instance, {
          draggingItemRect: e.active.rect.current.translated!,
          overRect: e.over?.rect,
        })
      }
    >
      {children}
      <DraggingPreview />
    </DndContext>
  );
}