import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import EditorService from 'service/EditorService';

import TabBar from './TabBar';
import Editor from './Editor';
import Mosaic from './Mosaic';
import BottomBar from './BottomBar';

export default observer(function Workbench() {
  const { tileManager } = container.resolve(EditorService);

  return (
    <div className="flex h-screen min-w-0 grow flex-col">
      <div className="grow">
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
      </div>
      <BottomBar />
    </div>
  );
});
