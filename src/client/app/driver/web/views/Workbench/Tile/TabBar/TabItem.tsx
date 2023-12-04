import { observer } from 'mobx-react-lite';
import { CloseOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { useRef, useEffect } from 'react';
import clsx from 'clsx';
import assert from 'assert';

import IconTitle from '@components/IconTitle';
import IconButton from '@components/IconButton';
import type Editor from '@domain/model/abstract/Editor';
import useContextmenu from './useContextmenu';
import { container } from 'tsyringe';
import DndService from '@domain/service/DndService';

export default observer(function TabItem({ editor }: { editor: Editor }) {
  const { tile } = editor;

  assert(tile);

  const { switchToEditor, removeEditor, currentEditor } = tile;
  const { setNodeRef, attributes, listeners } = useSortable({
    id: editor.id,
    data: { instance: editor },
  });
  const { overItem } = container.resolve(DndService);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        'flex cursor-pointer flex-nowrap items-center border-0 border-r border-solid border-gray-200 p-2 text-gray-500',
        currentEditor === editor ? 'bg-white' : overItem === editor ? 'bg-gray-200' : 'bg-gray-50',
      )}
      onClick={() => switchToEditor(editor)}
      onContextMenu={onContextMenu}
    >
      <IconTitle
        className="mr-1 max-w-[200px] text-sm"
        titleClassName="overflow-hidden text-ellipsis"
        size="1em"
        {...editor.tabView}
      />
      <IconButton ref={buttonRef} size="small" onClick={() => removeEditor(editor)}>
        <CloseOutlined />
      </IconButton>
    </div>
  );
});
