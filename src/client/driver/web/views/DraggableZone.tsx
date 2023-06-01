import { DndContext, MouseSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core';
import { container } from 'tsyringe';
import { DragOverlay, useDndContext } from '@dnd-kit/core';
import { ReactNode, useMemo } from 'react';

import EntityEditor from 'model/abstract/Editor';
import NoteService from 'service/NoteService';

import TabItem from './Workbench/TabBar/TabItem';
import NoteTree from './Explorer/Note/TreeView/DraggingTreeView';

// eslint-disable-next-line mobx/missing-observer
export function DragPreview() {
  const { active } = useDndContext();
  const { noteTree } = container.resolve(NoteService);
  const draggingItem = active?.data.current?.instance;

  const previewTree = useMemo(
    () => (noteTree.hasNode(draggingItem) ? noteTree.getFragmentFromSelected() : undefined),
    [draggingItem, noteTree],
  );

  return (
    <DragOverlay className="pointer-events-none" dropAnimation={null}>
      {draggingItem instanceof EntityEditor && <TabItem editor={draggingItem}></TabItem>}
      {previewTree && <NoteTree tree={previewTree} />}
    </DragOverlay>
  );
}

// eslint-disable-next-line mobx/missing-observer
export function DraggableZone({ children }: { children: ReactNode }) {
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
}