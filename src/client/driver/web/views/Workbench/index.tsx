import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { toJS } from 'mobx';

import EditorService from 'service/EditorService';

import TabBar from './TabBar';
import Editor from './Editor';
import Mosaic from './Mosaic';

export default observer(function Workbench() {
  const { tileManager } = container.resolve(EditorService);

  return (
    <div className="flex-grow min-w-0 h-screen">
      <Mosaic
        root={toJS(tileManager.root)}
        renderTile={(id) => (
          <div className="flex flex-col h-full">
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
