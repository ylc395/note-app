import { observer } from 'mobx-react-lite';
import { type ChangeEvent, useContext, useRef, useEffect } from 'react';
import { InfoCircleOutlined, FileSearchOutlined } from '@ant-design/icons';

import ui from '@web/infra/ui';
import Button from '@web/components/Button';

import EditorContext from './Context';

export default observer(function NoteTitle() {
  const { editor } = useContext(EditorContext);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => editor.updateTitle(e.target.value);

  useEffect(() => {
    if (editor.isEmpty && !editor.isFocused) {
      inputRef.current!.focus();
      editor.focus();
    }
  }, [editor, editor.isEmpty, editor.isFocused]);

  return (
    <div className="flex items-center border-0 border-b border-solid border-gray-200">
      <input
        ref={inputRef}
        className="grow border-none p-2 text-lg font-semibold"
        placeholder={editor.tabView.title}
        value={editor.title || ''}
        onChange={handleChange}
        disabled={typeof editor.title !== 'string'}
      />
      <div className="mr-2">
        <Button onClick={editor.toggleSearch}>
          <FileSearchOutlined />
        </Button>
        <Button onClick={() => ui.showModal(Symbol())}>
          <InfoCircleOutlined />
        </Button>
      </div>
    </div>
  );
});
