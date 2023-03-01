import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useState } from 'react';
import {
  type DragEndEvent,
  type DragStartEvent,
  DndContext,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';

import EditorService from 'service/EditorService';
import type EntityEditor from 'model/abstract/Editor';

import TabBar from './TabBar';
import Editor from './Editor';
import Mosaic from './Mosaic';
import TabItem from './TabBar/TabItem';

export default observer(function Workbench() {
  const { tileManager, moveEditor } = container.resolve(EditorService);
  const [draggingEditor, setDraggingEditor] = useState<EntityEditor | undefined>();
  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const { editor } = active.data.current as { editor: EntityEditor };

    setDraggingEditor(editor);
    editor.tile.switchToEditor(active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (over) {
        const { editor: srcEditor } = active.data.current as { editor: EntityEditor };
        const { editor: destEditor } = over.data.current as { editor: EntityEditor };
        moveEditor(srcEditor, destEditor);
      }
    },
    [moveEditor],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
  );

  return (
    <div className="h-screen min-w-0 grow">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
        <Mosaic
          root={tileManager.root}
          renderTile={(id) => (
            <div className="flex h-full flex-col">
              <TabBar tileId={id} />
              <Editor tileId={id} />
            </div>
          )}
        >
          空空如也
        </Mosaic>
        <DragOverlay>{draggingEditor && <TabItem editor={draggingEditor}></TabItem>}</DragOverlay>
      </DndContext>
    </div>
  );
});
