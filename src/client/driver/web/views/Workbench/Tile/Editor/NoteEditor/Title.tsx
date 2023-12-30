import { observer } from 'mobx-react-lite';
import { useContext, useRef, useEffect } from 'react';
import { MdOutlineAddReaction } from 'react-icons/md';

import ButtonPopover, { PopoverRef } from '@web/components/ButtonPopover';
import Picker from '@web/components/icon/Picker';
import Icon from '@web/components/icon/Icon';

import EditorContext from './Context';

export default observer(function NoteTitle() {
  const { editor } = useContext(EditorContext);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const popoverRef = useRef<PopoverRef | null>(null);

  useEffect(() => {
    if (editor.isEmpty && !editor.isFocused) {
      inputRef.current!.focus();
      editor.focus();
    }
  }, [editor, editor.isEmpty, editor.isFocused]);

  return (
    <div className="flex items-center border-0 border-b border-solid border-gray-200 px-1 py-2">
      <ButtonPopover
        ref={popoverRef}
        placement="bottom-start"
        className="mr-1 h-8"
        buttonContent={
          editor.icon ? (
            <Icon size="1.2em" code={editor.icon} />
          ) : (
            <MdOutlineAddReaction size="1.2em" className="text-gray-400" />
          )
        }
      >
        <Picker
          canClear={Boolean(editor.icon)}
          onSelect={(emoji) => {
            editor.updateIcon(emoji);
            popoverRef.current!.dismiss();
          }}
        />
      </ButtonPopover>
      <input
        spellCheck={false}
        ref={inputRef}
        className="grow border-none text-xl font-medium"
        placeholder={editor.tabView.title}
        value={editor.title || ''}
        onChange={(e) => editor.updateTitle(e.target.value)}
        disabled={typeof editor.title !== 'string'}
      />
    </div>
  );
});
