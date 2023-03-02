import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useCallback, useState } from 'react';
import { type DragStartEvent, DndContext, MouseSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';

import EditorService from 'service/EditorService';
import EntityEditor from 'model/abstract/Editor';

import TabBar from './TabBar';
import Editor from './Editor';
import Mosaic from './Mosaic';
import TabItem from './TabBar/TabItem';

export default observer(function Workbench() {
  const { tileManager } = container.resolve(EditorService);
  const [draggingEditor, setDraggingEditor] = useState<EntityEditor | undefined>();
  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const editor = active.data.current?.instance;

    if (editor instanceof EntityEditor) {
      setDraggingEditor(editor);
      editor.tile.switchToEditor(editor.id);
    }
  }, []);

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
      <DndContext onDragStart={handleDragStart} sensors={sensors}>
        <Mosaic
          root={tileManager.root}
          renderTile={(id) => (
            <div onFocus={() => tileManager.setFocusedTile(id)} className="flex h-full flex-col">
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
