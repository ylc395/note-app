import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { AiOutlineFileSearch, AiOutlineInfoCircle, AiOutlineSave } from 'react-icons/ai';

import Switch from '@web/components/Switch';
import Button from '@web/components/Button';
import IconPicker from '@web/components/icon/PickerButton';
import type NoteEditor from '@domain/app/model/note/Editor';

export default observer(function NoteTitle({ editor }: { editor: NoteEditor }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex items-center border-0 border-b border-solid border-gray-200 px-1 py-2">
      <IconPicker icon={editor.info?.icon || null} onSelect={(icon) => editor.updateEntity({ icon })} />
      <input
        spellCheck={false}
        ref={inputRef}
        className="grow border-none text-xl font-medium"
        placeholder={editor.tabView.title}
        value={editor.info?.title || ''}
        onChange={(e) => {
          editor.updateEntity({ title: e.target.value });
        }}
        readOnly={editor.isReadonly}
        disabled={typeof editor.info?.title !== 'string'}
      />
      <div className="mr-2 flex space-x-1">
        <Button>
          <AiOutlineFileSearch />
        </Button>
        <Button>
          <AiOutlineInfoCircle />
        </Button>
        <Button disabled={!editor.canSubmitNewVersion} onClick={editor.submitNewVersion}>
          <AiOutlineSave />
        </Button>
        <Switch trueText="仅阅读" falseText="可编辑" value={editor.isReadonly} onChange={editor.setReadonly} />
      </div>
    </div>
  );
});
