import { observer } from 'mobx-react-lite';
import { MosaicWindow, type MosaicBranch } from 'react-mosaic-component';
import { container } from 'tsyringe';

import EditorService from 'service/EditorService';
import NoteEditor from 'model/note/Editor';
import type { TileId } from 'model/mosaic/TileManger';

import NoteWorkbench from './Note';
import Tabs from './Tabs';

export default observer(function Window({ path, id }: { path: MosaicBranch[]; id: TileId }) {
  const { tileManager } = container.resolve(EditorService);
  const w = tileManager.get(id, true);

  if (!w) {
    return null;
  }

  return (
    <MosaicWindow
      path={path}
      title=""
      renderToolbar={() => (
        // mosaic lib require a native element instead of a custom component
        <div className="w-full">
          <Tabs id={id} />
        </div>
      )}
    >
      {w.currentTab instanceof NoteEditor && <NoteWorkbench editor={w.currentTab} />}
    </MosaicWindow>
  );
});
