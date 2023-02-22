import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { toJS } from 'mobx';
import { DndContext } from '@dnd-kit/core';

import EditorService from 'service/EditorService';
import Tile from './Tile';
import { type TileNode, isTileId, TileDirections } from 'model/workbench/TileManger';

const renderTiles = (tile?: TileNode) => {
  if (!tile) {
    return <div>无窗口</div>;
  }

  if (isTileId(tile)) {
    return <Tile id={tile} />;
  }

  return (
    <div className={`w-full h-full flex ${tile.direction === TileDirections.Vertical ? 'flex-col' : ''}`}>
      {renderTiles(tile.first)}
      {renderTiles(tile.second)}
    </div>
  );
};

export default observer(function Workbench() {
  const { tileManager } = container.resolve(EditorService);

  return (
    <DndContext onDragOver={console.log}>
      <div className="flex-grow">{renderTiles(toJS(tileManager.root))}</div>
    </DndContext>
  );
});
