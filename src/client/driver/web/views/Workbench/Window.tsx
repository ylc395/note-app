import { observer } from 'mobx-react-lite';
import { MosaicWindow, type MosaicBranch } from 'react-mosaic-component';
import { container } from 'tsyringe';

import { EntityTypes } from 'interface/Entity';
import WorkbenchService, { type WindowId } from 'service/WorkbenchService';
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
      {w.currentTab?.type === EntityTypes.Note && w.currentTab.editor && <NoteWorkbench editor={w.currentTab.editor} />}
    </MosaicWindow>
  );
});
