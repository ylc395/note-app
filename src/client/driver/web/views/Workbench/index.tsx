import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import WorkbenchService from 'service/WorkbenchService';
import ImageEditor from './ImageEditor';

export default observer(function Workbench() {
  const { windows } = container.resolve(WorkbenchService);

  return (
    <div className="flex-grow">
      {windows.map((w) => (
        <div key={w.id}>{w.currentTab?.type.startsWith('image') && <ImageEditor blob={w.currentTab.blob} />}</div>
      ))}
    </div>
  );
});
