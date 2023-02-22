import { observer } from 'mobx-react-lite';
import { type ReactNode, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import uniqueId from 'lodash/uniqueId';

export default observer(function TabItem({ children }: { children: ReactNode }) {
  const [id] = useState(() => uniqueId('tab-'));
  const { setNodeRef: draggableRef, listeners } = useDraggable({ id });
  const { setNodeRef: droppableRef } = useDroppable({ id });

  return (
    <div ref={droppableRef}>
      <div ref={draggableRef} {...listeners}>
        {children}
      </div>
    </div>
  );
});
