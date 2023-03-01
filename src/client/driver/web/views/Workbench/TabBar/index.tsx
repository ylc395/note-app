import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Button, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

import EditorService from 'service/EditorService';
import type Tile from 'model/workbench/Tile';

import TabItem from './TabItem';

export default observer(function TabBar({ tileId }: { tileId: Tile['id'] }) {
  const { tileManager } = container.resolve(EditorService);
  const tile = tileManager.getTile(tileId);
  const { currentEditor, editors, closeAllEditors } = tile;

  if (!currentEditor) {
    return null;
  }

  return (
    <div className="flex justify-between border-0 border-b border-solid border-gray-200">
      <SortableContext items={editors} strategy={horizontalListSortingStrategy}>
        <div className="scrollbar-hidden flex overflow-auto">
          {editors.map((editor) => (
            <TabItem key={editor.id} editor={editor} />
          ))}
        </div>
      </SortableContext>
      <div className="flex items-center">
        {__ENV__ === 'dev' ? tileId : null}
        <Tooltip title="关闭全部">
          <Button onClick={closeAllEditors} type="text" icon={<CloseOutlined />} />
        </Tooltip>
      </div>
    </div>
  );
});
