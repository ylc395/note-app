import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Mosaic } from 'react-mosaic-component';
import { toJS } from 'mobx';
import 'react-mosaic-component/react-mosaic-component.css';

import EditorService from 'service/EditorService';
import Window from './Window';
import './index.css';

export default observer(function Workbench() {
  const { windowManager } = container.resolve(EditorService);

  return (
    <div className="flex-grow">
      <Mosaic
        className="bg-transparent"
        renderTile={(id, path) => <Window id={id} path={path} />}
        value={toJS(windowManager.root || null)}
        onChange={windowManager.update}
      />
    </div>
  );
});
