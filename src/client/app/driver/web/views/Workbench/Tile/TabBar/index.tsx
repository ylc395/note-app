import { observer } from 'mobx-react-lite';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';
import { container } from 'tsyringe';

import type Tile from '@domain/model/workbench/Tile';
import TileHandler from '@domain/service/DndService/TileHandler';

import TabItem from './TabItem';
import { useEffect } from 'react';

export default observer(function TabBar({ tile }: { tile: Tile }) {
  const { editors } = tile;
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `${tile.id}-tab`,
    data: { instance: tile },
  });
  const { toggleDropAreaEnabled } = container.resolve(TileHandler);

  useEffect(() => {
    toggleDropAreaEnabled(!isOver);
  }, [isOver, toggleDropAreaEnabled]);

  return (
    <div className="flex justify-between border-0 border-b border-solid border-gray-200">
      <div
        className={clsx('scrollbar-hidden flex grow overflow-auto', isOver ? 'bg-slate-200' : 'bg-gray-50')}
        ref={setDroppableRef}
      >
        <SortableContext items={editors} strategy={horizontalListSortingStrategy}>
          {editors.map((editor) => (
            <TabItem key={editor.id} editor={editor} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
});
