import { observer } from 'mobx-react-lite';
import { CloseOutlined } from '@ant-design/icons';
import { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import assert from 'assert';

import type Editor from '@domain/app/model/abstract/Editor';
import IconTitle from '@web/components/IconTitle';
import Button from '@web/components/Button';
import Draggable from '@web/components/dnd/Draggable';
import Droppable from '@web/components/dnd/Droppable';
import useDrop from './useDrop';

export default observer(function TabItem({ editor }: { editor: Editor }) {
  const { tile } = editor;

  assert(tile);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOver, setIsOver] = useState(false);
  const { onDrop } = useDrop(editor);

  const { switchToEditor, removeEditor, currentEditor } = tile;

  useEffect(() => {
    currentEditor === editor && buttonRef.current!.scrollIntoView();
  }, [currentEditor, editor]);

  if (!currentEditor) {
    throw new Error('no current editor');
  }

  return (
    <Droppable onDrop={onDrop} onOverToggle={setIsOver}>
      <Draggable
        item={editor}
        className={clsx(
          'flex cursor-pointer flex-nowrap items-center border-0 border-r border-solid border-gray-200 p-2 text-gray-500',
          currentEditor === editor ? 'bg-white' : isOver ? 'bg-gray-200' : 'bg-gray-50',
        )}
      >
        <IconTitle
          className="mr-1 max-w-[200px] text-sm"
          titleClassName="overflow-hidden text-ellipsis"
          size="1em"
          onClick={() => switchToEditor(editor)}
          {...editor.tabView}
        />
        <Button ref={buttonRef} size="small" onClick={() => removeEditor(editor)}>
          <CloseOutlined />
        </Button>
      </Draggable>
    </Droppable>
  );
});
