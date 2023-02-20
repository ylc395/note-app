import { observer } from 'mobx-react-lite';
import { MosaicWindow, type MosaicBranch } from 'react-mosaic-component';
import { container } from 'tsyringe';

import WorkbenchService, { type WindowId } from 'service/WorkbenchService';
import NoteEditor from 'model/editor/NoteEditor';

import NoteWorkbench from './Note';
import Tabs from './Tabs';

export default observer(function Window({ path, id }: { path: MosaicBranch[]; id: WindowId }) {
  const { windowManager } = container.resolve(WorkbenchService);
  const w = windowManager.get(id, true);

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
      {w.currentTab?.editor instanceof NoteEditor && <NoteWorkbench editor={w.currentTab.editor} />}
    </MosaicWindow>
  );
});
