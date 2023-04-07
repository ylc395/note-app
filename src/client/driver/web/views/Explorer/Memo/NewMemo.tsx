import { useCallback, useEffect, useRef } from 'react';
import { container } from 'tsyringe';
import { Button } from 'antd';
import { observer } from 'mobx-react-lite';
import { useCreation } from 'ahooks';

import MemoService from 'service/MemoService';
import MarkdownEditor, { type EditorRef } from 'web/components/MarkdownEditor';

export default observer(function NewMemo() {
  const memoService = container.resolve(MemoService);
  const editorRef = useRef<EditorRef>(null);
  const create = useCallback(async () => {
    await memoService.createMemo();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editorRef.current!.updateContent('');
  }, [memoService]);

  const clear = useCallback(() => {
    memoService.updateNewContent('');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editorRef.current!.updateContent('', false);
  }, [memoService]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editorRef.current!.updateContent(memoService.newContent, true);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editorRef.current!.focus();
  }, [memoService]);

  const markdownEditor = useCreation(
    () => (
      <MarkdownEditor defaultValue={memoService.newContent} ref={editorRef} onChange={memoService.updateNewContent} />
    ),
    [],
  );

  return (
    <div className="mt-2 bg-white px-2 pb-2">
      <div className="h-20 cursor-text border border-solid border-gray-300 p-1 text-sm">{markdownEditor}</div>
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
