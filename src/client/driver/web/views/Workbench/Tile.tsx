import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useDroppable } from '@dnd-kit/core';
import { Resizable } from 're-resizable';

import EditorService from 'service/EditorService';
import NoteEditor from 'model/note/Editor';
import type Tile from 'model/workbench/Tile';

import NoteEditorView from './NoteEditor';
import TabBar from './TabBar';
import { isTileId, TileDirections, type TileParent } from 'model/workbench/TileManger';

export default observer(function Tile({ id, parent }: { id: Tile['id']; parent?: TileParent }) {
  const { tileManager } = container.resolve(EditorService);
  const tile = tileManager.get(id);
  const { setNodeRef: editorRef } = useDroppable({ id: `${id}-editor` });

  const isWithoutSibling = parent && !(isTileId(parent.first) && isTileId(parent.second));
  const isFirstChild = parent && parent.first === id;

  const content = (
    <>
      <TabBar id={id} />
      {tile.currentTab instanceof NoteEditor && <NoteEditorView editor={tile.currentTab} ref={editorRef} />}
    </>
  );

  return isWithoutSibling || isFirstChild ? (
    <Resizable
      enable={{
        [isFirstChild ? 'bottom' : 'top']: parent.direction === TileDirections.Vertical,
        [isFirstChild ? 'right' : 'left']: parent.direction === TileDirections.Horizontal,
      }}
      defaultSize={{
        height: parent.direction === TileDirections.Vertical ? '50%' : '100%',
        width: parent.direction === TileDirections.Horizontal ? '50%' : '100%',
      }}
      maxWidth="100%"
      maxHeight="100%"
      className="flex flex-col bg-blue-100 overflow-x-auto"
    >
      {content}
    </Resizable>
  ) : (
    <div
      className={`max-h-full flex flex-col flex-1 min-w-0 min-h-0 ${
        !parent || parent.direction === TileDirections.Horizontal ? 'h-full' : ''
      }`}
    >
      {content}
    </div>
  );
});
