import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { toJS } from 'mobx';
import { DndContext } from '@dnd-kit/core';

import EditorService from 'service/EditorService';
import Tile from './Tile';
import { type TileNode, isTileId, TileDirections, type TileParent } from 'model/workbench/TileManger';

const renderTiles = (tile?: TileNode, parent?: TileParent) => {
  if (!tile) {
    return <div>无窗口</div>;
  }

  if (isTileId(tile)) {
    return <Tile key={tile} id={tile} parent={parent} />;
  }

  return (
    <div
      className={`flex w-full h-full flex-1 max-h-full max-w-full min-h-0 min-w-0  ${
        tile.direction === TileDirections.Vertical ? 'flex-col' : ''
      }`}
    >
      {renderTiles(tile.first, tile)}
      {renderTiles(tile.second, tile)}
    </div>
  );
};

export default observer(function Workbench() {
  const { tileManager } = container.resolve(EditorService);

  return (
    <DndContext onDragOver={console.log}>
      <div className="flex-grow min-w-0 h-screen">{renderTiles(toJS(tileManager.root))}</div>
    </DndContext>
  );
});
