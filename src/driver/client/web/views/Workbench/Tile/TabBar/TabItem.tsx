import { observer } from 'mobx-react-lite';
import { AiOutlineClose } from 'react-icons/ai';
import { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import assert from 'assert';
import { container } from 'tsyringe';

import type Editor from '@domain/client/app/model/abstract/Editor';

import IconTitle from '@web/components/IconTitle';
import Button from '@web/components/Button';
import Draggable from '@web/components/dnd/Draggable';
import Droppable from '@web/components/dnd/Droppable';
import MimeTypeIcon from '@web/components/icon/MimeTypeIcon';
import TypeIcon from '@web/components/icon/TypeIcon';

import useDrop from './useDrop';
import MoveBehavior from '@domain/client/app/model/behavior/MoveBehavior';

export default observer(function TabItem({ editor }: { editor: Editor }) {
  const { tile } = editor;
  assert(tile);

  const { startMoving, finishMoving } = container.resolve(MoveBehavior);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOver, setIsOver] = useState(false);
  const { onDrop } = useDrop(editor);

  const { switchToEditor, removeEditor, currentEditor } = tile;

  useEffect(() => {
    currentEditor === editor && buttonRef.current!.scrollIntoView();
  }, [currentEditor, editor]);

  assert(currentEditor, 'no current editor');

  return (
    <Droppable onDrop={onDrop} onOverToggle={setIsOver}>
      <Draggable
        item={editor}
        className={clsx(
          'flex flex-nowrap items-center border-0 border-r border-solid border-layout px-2 text-text-secondary',
          currentEditor === editor ? 'bg-white' : isOver ? 'bg-gray-200' : 'bg-gray-50',
        )}
        onDragStart={() => startMoving({ mode: 'drag', item: editor })}
        onDragEnd={finishMoving}
      >
        <IconTitle
          defaultIcon={
            editor.entityLocator.mimeType ? (
              <MimeTypeIcon mimeType={editor.entityLocator.mimeType} />
            ) : (
              <TypeIcon type={editor.entityLocator.entityType} />
            )
          }
          className="mr-1 h-6 max-w-[200px] cursor-pointer py-3 text-sm"
          titleClassName={clsx('overflow-hidden text-ellipsis', !editor.isEditing && 'italic')}
          iconSize="1em"
          onClick={() => switchToEditor(editor)}
          onDoubleClick={editor.setIsEditing}
          {...editor.tabView}
        />
        <Button ref={buttonRef} size="small" onClick={() => removeEditor(editor)}>
          <AiOutlineClose />
        </Button>
      </Draggable>
    </Droppable>
  );
});
