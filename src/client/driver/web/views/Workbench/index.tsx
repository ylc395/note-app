import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Mosaic } from 'react-mosaic-component';
import { toJS } from 'mobx';
import 'react-mosaic-component/react-mosaic-component.css';

import type { TileId } from 'model/mosaic/TileManger';
import EditorService from 'service/EditorService';
import Tile from './Tile';
import './index.css';

export default observer(function Workbench() {
  const { tileManager } = container.resolve(EditorService);

  return (
    <div className="flex-grow">
      <Mosaic<TileId>
        className="bg-transparent"
        renderTile={(id, path) => <Tile id={id} path={path} />}
        value={toJS(tileManager.root || null)}
        onChange={tileManager.update}
      />
    </div>
  );
});
