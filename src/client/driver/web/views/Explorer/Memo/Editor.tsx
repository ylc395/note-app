import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { useRef, useEffect } from 'react';

import MemoService from '@domain/app/service/MemoService';
import Editor from '@domain/app/model/memo/Editor';

export default observer(function MemoEditor({ editor }: { editor?: Editor }) {
  const {
    list: { newRootMemoEditor },
  } = container.resolve(MemoService);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const _editor = editor || newRootMemoEditor;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div>
      <textarea ref={textareaRef} value={_editor.content} onChange={(e) => _editor.updateContent(e.target.value)} />
      <div>
        <button onClick={_editor.submit}>提交</button>
        {editor ? <button onClick={_editor.cancel}>取消</button> : <button onClick={_editor.reset}>重置</button>}
      </div>
    </div>
  );
});
