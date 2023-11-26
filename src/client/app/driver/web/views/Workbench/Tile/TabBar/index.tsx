import { observer } from 'mobx-react-lite';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';

import Tile from 'model/workbench/Tile';

import TabItem from './TabItem';

export default observer(function TabBar({ tile }: { tile: Tile }) {
  const { editors } = tile;
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `${tile}-tab`,
    data: { instance: tile },
  });

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
