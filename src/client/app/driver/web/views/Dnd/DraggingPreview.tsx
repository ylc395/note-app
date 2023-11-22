import { container } from 'tsyringe';
import { DragOverlay } from '@dnd-kit/core';
import { observer } from 'mobx-react-lite';

import DndService from 'service/DndService';
import Editor from 'model/abstract/Editor';
import NoteTree from 'model/note/Tree';
import MaterialTree from 'model/material/Tree';

import TabItem from '../Workbench/Tile/TabBar/TabItem';
import TreeView from '../Explorer/components/TreeView';

export default observer(function DragPreview() {
  const { previewingItem } = container.resolve(DndService);

  return (
    <DragOverlay className="pointer-events-none" dropAnimation={null}>
      {previewingItem instanceof Editor && <TabItem editor={previewingItem}></TabItem>}
      {previewingItem instanceof NoteTree && <TreeView tree={previewingItem} />}
      {previewingItem instanceof MaterialTree && <TreeView tree={previewingItem} />}
    </DragOverlay>
  );
});
