import { observer } from 'mobx-react-lite';
import { useRef, useEffect } from 'react';

import assert from 'assert';
import MemoTreeNode from '@domain/app/model/memo/TreeNode';

export default observer(function MemoEditor({ node, isChild = false }: { node: MemoTreeNode; isChild?: boolean }) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editor = isChild ? node.newChildEditor : node.editor;

  assert(editor);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div>
      <textarea ref={textareaRef} value={editor.content} onChange={(e) => editor.updateContent(e.target.value)} />
      <div>
        <button onClick={editor.submit}>提交</button>
        <button onClick={editor.cancel}>取消</button>
      </div>
    </div>
  );
});
