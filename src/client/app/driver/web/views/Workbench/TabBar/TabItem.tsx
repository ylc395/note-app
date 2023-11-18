import { observer } from 'mobx-react-lite';
import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { useRef, useEffect } from 'react';
import clsx from 'clsx';

import IconTitle from 'web/components/IconTitle';
import type Editor from 'model/abstract/Editor';
import useContextmenu from './useContextmenu';

export default observer(function TabItem({ editor }: { editor: Editor }) {
  const { tile } = editor;
  const { switchToEditor, removeEditor, currentEditor } = tile;
  const { setNodeRef, attributes, listeners, over } = useSortable({
    id: editor.id,
    data: { instance: editor },
  });
  const buttonRef = useRef<HTMLElement>(null);

  useEffect(() => {
    currentEditor === editor && buttonRef.current!.scrollIntoView();
  }, [currentEditor, editor]);

  const onContextMenu = useContextmenu();

  if (!currentEditor) {
    throw new Error('no current editor');
  }

  return (
    <div
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      className={clsx(
        'flex cursor-pointer flex-nowrap items-center border-0 border-r border-solid border-gray-200 bg-gray-100 p-2',
        {
          'bg-white': currentEditor === editor,
          'bg-gray-200': over?.id === editor.id,
        },
      )}
      onClick={() => switchToEditor(editor.id)}
      onContextMenu={onContextMenu}
    >
      <IconTitle
        className="mr-1 max-w-[200px] text-sm"
        titleClassName=" overflow-hidden text-ellipsis"
        size="1em"
        {...editor.tabView}
      />
      <Button
        ref={buttonRef}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          removeEditor(editor.id);
        }}
        onFocus={(e) => e.stopPropagation()}
        type="text"
        icon={<CloseOutlined />}
      />
    </div>
  );
});
