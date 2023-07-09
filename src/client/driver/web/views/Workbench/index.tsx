import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import EditorService from 'service/EditorService';

import Mosaic from './Mosaic';
import Main from './Main';
import BottomBar from './BottomBar';

export default observer(function Workbench() {
  const { tileManager } = container.resolve(EditorService);

  return (
    <div className="flex h-full min-w-0 grow flex-col overflow-hidden">
      <Mosaic root={tileManager.root} renderTile={(id) => <Main tileId={id} />}>
        <div className="h-full">空空如也</div>
      </Mosaic>
      <BottomBar />
    </div>
  );
});
