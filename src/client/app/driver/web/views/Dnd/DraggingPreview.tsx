import { container } from 'tsyringe';
import { DragOverlay } from '@dnd-kit/core';
import { observer } from 'mobx-react-lite';

import DndService from '@domain/service/DndService';
import Editor from '@domain/model/abstract/Editor';
import NoteTree from '@domain/model/note/Tree';
import MaterialTree from '@domain/model/material/Tree';

import TabItem from '../Workbench/Tile/TabBar/TabItem';
import TreeView from '../Explorer/components/TreeView';

export default observer(function DragPreview() {
  const { previewingItem } = container.resolve(DndService);

  return (
    <DragOverlay className="pointer-events-none" dropAnimation={null}>
      {previewingItem instanceof Editor && <TabItem editor={previewingItem} />}
      {previewingItem instanceof NoteTree && <TreeView tree={previewingItem} />}
      {previewingItem instanceof MaterialTree && <TreeView tree={previewingItem} />}
    </DragOverlay>
  );
});
