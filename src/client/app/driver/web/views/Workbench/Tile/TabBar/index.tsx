import { observer } from 'mobx-react-lite';
import { Button, Tooltip } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CloseOutlined } from '@ant-design/icons';

import Tile from 'model/workbench/Tile';

import TabItem from './TabItem';

export default observer(function TabBar({ tile }: { tile: Tile }) {
  const { editors, closeAllEditors } = tile;

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `${tile}-tab`,
    data: { instance: tile },
  });

  return (
    <div className="flex justify-between border-0 border-b border-solid border-gray-200">
      <div className={`scrollbar-hidden flex grow overflow-auto ${isOver ? 'bg-gray-200' : ''}`} ref={setDroppableRef}>
        <SortableContext items={editors} strategy={horizontalListSortingStrategy}>
          {editors.map((editor) => (
            <TabItem key={editor.id} editor={editor} />
          ))}
        </SortableContext>
      </div>
      <div className="flex items-center">
        <Tooltip title="关闭全部">
          <Button onClick={closeAllEditors} type="text" icon={<CloseOutlined />} />
        </Tooltip>
      </div>
    </div>
  );
});
