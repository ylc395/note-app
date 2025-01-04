import { observer } from 'mobx-react-lite';
import { AiOutlineClose } from 'react-icons/ai';
import { useRef, useEffect } from 'react';
import clsx from 'clsx';
import assert from 'assert';

import type Editor from '#domain/client/app/model/note/editor/BaseEditor';

import IconTitle from '#web/components/IconTitle';
import Button from '#web/components/Button';
import MimeTypeIcon from '#web/components/icon/MimeTypeIcon';
import TypeIcon from '#web/components/icon/TypeIcon';

export default observer(function TabItem({ editor }: { editor: Editor }) {
  const { tile } = editor;
  assert(tile);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const { switchToEditor, currentEditor } = tile;

  useEffect(() => {
    currentEditor === editor && buttonRef.current!.scrollIntoView();
  }, [currentEditor, editor]);

  assert(currentEditor, 'no current editor');

  return (
    <div
      className={clsx(
        'flex flex-nowrap items-center border-0 border-r border-solid border-layout px-2',
        currentEditor === editor ? 'bg-layout-highlight text-text-primary' : 'text-text-secondary bg-layout',
      )}
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
        titleClassName={clsx('overflow-hidden text-ellipsis')}
        iconSize="1em"
        onClick={() => switchToEditor(editor)}
        {...editor.view}
      />
      <Button ref={buttonRef} size="small" onClick={editor.destroy}>
        <AiOutlineClose />
      </Button>
    </div>
  );
});
