import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import EditorService from 'service/EditorService';

import TabBar from './TabBar';
import Editor from './Editor';
import Mosaic from './Mosaic';

export default observer(function Workbench() {
  const { tileManager } = container.resolve(EditorService);

  return (
    <div className="h-screen min-w-0 grow">
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
    </div>
  );
});
