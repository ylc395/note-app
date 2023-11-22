import { observer } from 'mobx-react-lite';
import { CloseOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { useRef, useEffect } from 'react';
import clsx from 'clsx';

import IconTitle from 'web/components/IconTitle';
import IconButton from 'web/components/IconButton';
import type Editor from 'model/abstract/Editor';
import useContextmenu from './useContextmenu';

export default observer(function TabItem({ editor }: { editor: Editor }) {
  const { tile } = editor;
  const { switchToEditor, removeEditor, currentEditor } = tile;
  const { setNodeRef, attributes, listeners, over } = useSortable({
    id: editor.id,
    data: { instance: editor },
  });
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
        'flex cursor-pointer flex-nowrap items-center border-0 border-r border-solid border-gray-200 bg-gray-100 p-2',
        {
          'bg-slate-50': currentEditor === editor,
          'bg-gray-200': over?.data.current?.instance.id === editor.id,
        },
      )}
      onClick={() => switchToEditor(editor)}
      onContextMenu={onContextMenu}
    >
      <IconTitle
        className="mr-1 max-w-[200px] text-sm"
        titleClassName=" overflow-hidden text-ellipsis"
        size="1em"
        {...editor.tabView}
      />
      <IconButton ref={buttonRef} size="small" onClick={() => removeEditor(editor)}>
        <CloseOutlined />
      </IconButton>
    </div>
  );
});
