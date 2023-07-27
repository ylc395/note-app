import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Button, Tooltip } from 'antd';
import { useDroppable, useDndMonitor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CloseOutlined } from '@ant-design/icons';

import { IS_DEV } from 'infra/constants';
import EditorService from 'service/EditorService';
import Tile from 'model/workbench/Tile';
import EditorView from 'model/abstract/EditorView';

import TabItem from './TabItem';

export default observer(function TabBar({ tileId }: { tileId: Tile['id'] }) {
  const { tileManager, moveEditorView } = container.resolve(EditorService);
  const tile = tileManager.getTile(tileId);
  const { currentEditorView: currentEditor, editorViews: editors, closeAllEditorViews: closeAllEditors } = tile;
  const { setNodeRef, isOver } = useDroppable({
    id: `${tileId}-tab`,
    data: { instance: tile },
  });

  useDndMonitor({
    onDragEnd({ active, over }) {
      if (!over) {
        return;
      }

      const src = active.data.current?.instance;
      const dest = over.data.current?.instance;

      if (src instanceof EditorView && (dest instanceof EditorView || dest instanceof Tile)) {
        moveEditorView(src, dest);
      }
    },
    onDragStart({ active }) {
      const editor = active.data.current?.instance;

      if (editor instanceof EditorView) {
        editor.tile.switchToEditorView(editor.id);
      }
    },
  });

  if (!currentEditor) {
    return null;
  }

  return (
    <div className="flex justify-between border-0 border-b border-solid border-gray-200">
      <div className={`scrollbar-hidden flex grow overflow-auto ${isOver ? 'bg-gray-200' : ''}`} ref={setNodeRef}>
        <SortableContext items={editors} strategy={horizontalListSortingStrategy}>
          {editors.map((editor) => (
            <TabItem key={editor.id} editorView={editor} />
          ))}
        </SortableContext>
      </div>
      <div className="flex items-center">
        {IS_DEV ? <span className="text-xs">{tileId}</span> : null}
        <Tooltip title="关闭全部">
          <Button onFocus={(e) => e.stopPropagation()} onClick={closeAllEditors} type="text" icon={<CloseOutlined />} />
        </Tooltip>
      </div>
    </div>
  );
});
