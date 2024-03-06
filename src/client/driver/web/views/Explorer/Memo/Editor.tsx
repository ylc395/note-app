import { observer } from 'mobx-react-lite';
import { useRef, useEffect } from 'react';
import { container } from 'tsyringe';

import Editor from '@domain/app/model/memo/Editor';
import MemoExplorer from '@domain/app/model/memo/Explorer';
import assert from 'assert';

export default observer(function MemoEditor({ editor }: { editor: Editor }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { stopEditing } = container.resolve(MemoExplorer);

  function cancel() {
    assert(editor.memoId);
    stopEditing(editor.memoId, 'edit');
  }

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div>
      <textarea ref={textareaRef} value={editor.content} onChange={(e) => editor.updateContent(e.target.value)} />
      <div>
        <button onClick={editor.submit}>提交</button>
        {editor.memoId ? <button onClick={cancel}>取消</button> : <button onClick={editor.reset}>重置</button>}
      </div>
    </div>
  );
});
