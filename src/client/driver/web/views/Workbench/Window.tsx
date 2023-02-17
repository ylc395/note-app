import { observer } from 'mobx-react-lite';
import { MosaicWindow, type MosaicBranch } from 'react-mosaic-component';
import { container } from 'tsyringe';

import { EntityTypes } from 'interface/Entity';
import WorkbenchService, { type WindowId } from 'service/WorkbenchService';
import NoteWorkbench from './Note';
import Tabs from './Tabs';

export default observer(function Window({ path, id }: { path: MosaicBranch[]; id: WindowId }) {
  const { windowMap } = container.resolve(WorkbenchService);
  const w = windowMap.get(id);

  if (!w) {
    throw new Error(`invalid window id: ${id}`);
  }

  return (
    <MosaicWindow path={path} title="" renderToolbar={() => <Tabs id={id} />}>
      {w.currentTab?.type === EntityTypes.Note && w.currentTab.editor && <NoteWorkbench editor={w.currentTab.editor} />}
    </MosaicWindow>
  );
});
