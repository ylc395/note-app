import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Button, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useEffect, useRef } from 'react';

import EditorService from 'service/EditorService';
import type Tile from 'model/workbench/Tile';
import IconTitle from 'web/components/common/IconTitle';

export default observer(function TabBar({ tileId }: { tileId: Tile['id'] }) {
  const { tileManager } = container.resolve(EditorService);
  const { switchToEditor, closeEditor, currentEditor, editors, closeAllEditors } = tileManager.get(tileId);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current || !currentEditor) {
      return;
    }

    const tabEl = rootRef.current.querySelector(`[data-editor-id=${currentEditor.id}]`) as HTMLElement;
    tabEl.scrollIntoView();
  }, [currentEditor]);

  if (!currentEditor) {
    return null;
  }

  return (
    <div ref={rootRef} className="flex justify-between border-0 border-b border-solid border-gray-200">
      <div className="scrollbar-hidden flex overflow-auto">
        {editors.map(({ id, tabView }) => (
          <div
            data-editor-id={id}
            className={`flex cursor-pointer flex-nowrap items-center border-0 border-r border-solid border-gray-200 bg-gray-100 p-2 ${
              currentEditor.id === id ? 'bg-white' : ''
            }`}
            key={id}
            onClick={() => switchToEditor(id)}
          >
            <IconTitle
              className="mr-1 max-w-[200px] text-sm"
              titleClassName=" overflow-hidden text-ellipsis"
              size="1em"
              {...tabView}
            />
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                closeEditor(id);
              }}
              type="text"
              icon={<CloseOutlined />}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center">
        <Tooltip title="关闭全部">
          <Button onClick={closeAllEditors} type="text" icon={<CloseOutlined />} />
        </Tooltip>
      </div>
    </div>
  );
});
