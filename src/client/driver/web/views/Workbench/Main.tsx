import { container } from 'tsyringe';

import EditorService from 'service/EditorService';
import TabBar from './TabBar';
import Editor from './Editor';
import type Tile from 'model/workbench/Tile';

export default (function WorkbenchMain({ tileId }: { tileId: Tile['id'] }) {
  const { tileManager } = container.resolve(EditorService);

  return (
    <div onFocus={() => tileManager.setFocusedTile(tileId)} className="flex h-full flex-col">
      <TabBar tileId={tileId} />
      <Editor tileId={tileId} />
    </div>
  );
});
