import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { AiOutlineFileSearch, AiOutlineInfoCircle } from 'react-icons/ai';

import Button from '#web/components/Button';
import IconPicker from '#web/components/icon/PickerButton';
import type NoteEditor from '#domain/client/app/model/note/editor/BaseEditor';

export default observer(function NoteTitle({ editor }: { editor: NoteEditor }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex items-center border-0 border-b border-solid border-layout px-1 py-2">
      <IconPicker icon={editor.view.icon} onSelect={(icon) => editor.update({ icon })} />
      <input
        spellCheck={false}
        ref={inputRef}
        className="grow border-none text-xl font-medium"
        placeholder={editor.view.title}
        onChange={(e) => {
          editor.update({ title: e.target.value });
        }}
        readOnly={editor.uiState.value?.isReadonly}
        disabled={editor.isLoading}
      />
      <div className="mr-2 flex space-x-1">
        <Button>
          <AiOutlineFileSearch />
        </Button>
        <Button>
          <AiOutlineInfoCircle />
        </Button>
      </div>
    </div>
  );
});
