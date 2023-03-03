import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { DndContext, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';

import EditorService from 'service/EditorService';

import TabBar from './TabBar';
import Editor from './Editor';
import Mosaic from './Mosaic';
import BottomBar from './BottomBar';

export default observer(function Workbench() {
  const { tileManager } = container.resolve(EditorService);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
  );

  return (
    <div className="flex h-screen min-w-0 grow flex-col">
      <div className="grow">
        <DndContext sensors={sensors}>
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
        </DndContext>
      </div>
      <BottomBar />
    </div>
  );
});
