import { observer } from 'mobx-react-lite';
import { CloseOutlined } from '@ant-design/icons';
import { action } from 'mobx';
import { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';
import assert from 'assert';

import type Editor from '@domain/app/model/abstract/Editor';
import IconTitle from '@web/components/IconTitle';
import Button from '@web/components/Button';
import Draggable from '@web/components/dnd/Draggable';
import Droppable from '@web/components/dnd/Droppable';
import useDrop from './useDrop';
import { container } from 'tsyringe';
import ExplorerManager from '@domain/app/model/manager/ExplorerManager';
import TypeIcon from '@web/components/TypeIcon';

export default observer(function TabItem({ editor }: { editor: Editor }) {
  const { tile } = editor;

  assert(tile);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const { currentExplorer } = container.resolve(ExplorerManager);
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
        onDragStart={() => currentExplorer.updateTreeForDropping(editor.entityLocator.entityId)}
        onDragEnd={currentExplorer.reset}
        className={clsx(
          'flex flex-nowrap items-center border-0 border-r border-solid border-gray-200 px-2 text-gray-500',
          currentEditor === editor ? 'bg-white' : isOver ? 'bg-gray-200' : 'bg-gray-50',
        )}
      >
        <IconTitle
          defaultIcon={<TypeIcon type={editor.entityLocator.entityType} />}
          className="mr-1 h-6 max-w-[200px] cursor-pointer py-3 text-sm"
          titleClassName={clsx('overflow-hidden text-ellipsis', !editor.isActive && 'italic')}
          iconSize="1em"
          onClick={() => switchToEditor(editor)}
          onDoubleClick={action(() => (editor.isActive = true))}
          {...editor.tabView}
        />
        <Button ref={buttonRef} size="small" onClick={() => removeEditor(editor)}>
          <CloseOutlined />
        </Button>
      </Draggable>
    </Droppable>
  );
});
