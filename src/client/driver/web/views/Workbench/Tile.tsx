import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useDroppable } from '@dnd-kit/core';
import { Resizable } from 're-resizable';

import EditorService from 'service/EditorService';
import NoteEditor from 'model/note/Editor';
import type Tile from 'model/workbench/Tile';

import NoteEditorView from './NoteEditor';
import TabBar from './TabBar';

export default observer(function Tile({ id }: { id: Tile['id'] }) {
  const { tileManager } = container.resolve(EditorService);
  const tile = tileManager.get(id, true);
  const { setNodeRef: editorRef } = useDroppable({ id: `${id}-editor` });

  if (!tile) {
    return null;
  }

  return (
    // <Resizable enable={{ right: true, left: true }} minWidth={220}>
    <div className="h-full w-full">
      <TabBar id={id} />
      <div ref={editorRef}>{tile.currentTab instanceof NoteEditor && <NoteEditorView editor={tile.currentTab} />}</div>
    </div>
    // </Resizable>
  );
});
