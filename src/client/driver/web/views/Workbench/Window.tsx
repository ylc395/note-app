import { observer } from 'mobx-react-lite';
import { MosaicWindow, type MosaicBranch } from 'react-mosaic-component';
import { container } from 'tsyringe';

import WorkbenchService, { type WindowId } from 'service/WorkbenchService';
import ImageEditor from './ImageEditor';

export default observer(function Window({ path, id }: { path: MosaicBranch[]; id: WindowId }) {
  const { windowMap } = container.resolve(WorkbenchService);
  const w = windowMap.get(id);

  if (!w) {
    throw new Error(`invalid window id: ${id}`);
  }

  return (
    <MosaicWindow path={path} title="">
      {w.currentTab?.type === 'image' ? <ImageEditor blob={w.currentTab.blob} /> : null}
    </MosaicWindow>
  );
});
