import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Mosaic } from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';

import WorkbenchService from 'service/WorkbenchService';
import Window from './Window';

export default observer(function Workbench() {
  const { layout, updateLayout } = container.resolve(WorkbenchService);

  return (
    <div className="flex-grow">
      <Mosaic
        renderTile={(id, path) => <Window id={id} path={path} />}
        value={layout || null}
        onChange={updateLayout}
      />
    </div>
  );
});
