import { observer } from 'mobx-react-lite';
import { useContext, useRef, useEffect } from 'react';
import { MdOutlineAddReaction } from 'react-icons/md';
import { AiOutlineFileSearch, AiOutlineInfoCircle } from 'react-icons/ai';

import ButtonPopover, { PopoverRef } from '@web/components/ButtonPopover';
import Switch from '@web/components/Switch';
import Picker from '@web/components/icon/Picker';
import Icon from '@web/components/icon/Icon';

import EditorContext from './Context';
import Button from '@web/components/Button';

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
            editor.updateInfo({ icon: emoji });
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
        onChange={(e) => editor.updateInfo({ title: e.target.value })}
        readOnly={editor.isReadonly}
        disabled={typeof editor.title !== 'string'}
      />
      <div className="mr-2 flex space-x-2">
        <Button>
          <AiOutlineFileSearch />
        </Button>
        <Button>
          <AiOutlineInfoCircle />
        </Button>
        <Switch
          trueText="仅阅读"
          falseText="可编辑"
          value={editor.isReadonly}
          onChange={(value) => editor.updateInfo({ isReadonly: value })}
        />
      </div>
    </div>
  );
});
