import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import PanelService from 'service/PanelService';
import ImageWindow from './ImageWindow';

export default observer(function Workbench() {
  const { panels } = container.resolve(PanelService);

  return (
    <div className="flex-grow">
      {panels.map((panel) => (
        <div key={panel.id}>{panel.currentTab && <ImageWindow imageWindow={panel.currentTab} />}</div>
      ))}
    </div>
  );
});
