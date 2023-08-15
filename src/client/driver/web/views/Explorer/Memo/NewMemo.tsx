import { useCallback, useEffect, useState } from 'react';
import { container } from 'tsyringe';
import { Button } from 'antd';
import { observer } from 'mobx-react-lite';

import MemoService from 'service/MemoService';
import MarkdownEditor from 'web/components/MarkdownEditor';
import type Editor from 'web/components/MarkdownEditor/Editor';

export default observer(function NewMemo() {
  const memoService = container.resolve(MemoService);
  const [markdownEditor, setMarkdownEditor] = useState<Editor | null>(null);
  const create = useCallback(async () => {
    await memoService.createMemo();
    markdownEditor?.resetContent('');
  }, [markdownEditor, memoService]);

  const clear = useCallback(() => {
    memoService.updateNewContent('');
    markdownEditor?.resetContent('');
  }, [markdownEditor, memoService]);

  useEffect(() => {
    markdownEditor?.resetContent(memoService.newContent);
    markdownEditor?.focus();
  }, [markdownEditor, memoService]);

  return (
    <div className="mt-2 bg-white px-2 pb-2">
      <div className="h-20 cursor-text border border-solid border-gray-300 p-1 text-sm">
        <MarkdownEditor
          defaultValue={memoService.newContent}
          onChange={memoService.updateNewContent}
          onInitialized={setMarkdownEditor}
        />
      </div>
      <div className="mt-2 text-right">
        <Button disabled={!memoService.newContent} onClick={clear} size="small" className="mr-2">
          清除
        </Button>
        <Button disabled={!memoService.newContent} size="small" onClick={create} type="primary">
          创建
        </Button>
      </div>
    </div>
  );
});
