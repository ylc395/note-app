import { observer } from 'mobx-react-lite';
import { MosaicWindow, type MosaicBranch } from 'react-mosaic-component';
import { container } from 'tsyringe';

import WorkbenchService, { type WindowId } from 'service/WorkbenchService';
import NoteEditor from './Note/Editor';
import Tabs from './Tabs';

export default observer(function Window({ path, id }: { path: MosaicBranch[]; id: WindowId }) {
  const { windowMap } = container.resolve(WorkbenchService);
  const w = windowMap.get(id);

  if (!w) {
    throw new Error(`invalid window id: ${id}`);
  }

  return (
    <MosaicWindow path={path} title="" renderToolbar={() => <Tabs id={id} />}>
      {w.currentTab?.type === 'note' && w.currentTab.editor && <NoteEditor window={w} />}
    </MosaicWindow>
  );
});
