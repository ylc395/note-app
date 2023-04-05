import { observer } from 'mobx-react-lite';
import { Button } from 'antd';
import { container } from 'tsyringe';
import { useCallback, useRef, useMemo } from 'react';
import { useBoolean } from 'ahooks';

import MarkdownEditor, { type EditorRef } from 'web/components/MarkdownEditor';
import MemoService from 'service/MemoService';
import List from './List';
import Search from './Search';
import Operations from './Operations';
import { action, runInAction } from 'mobx';

export default observer(() => {
  const memoService = container.resolve(MemoService);
  const editorRef = useRef<EditorRef>(null);
  const [isExpanded, { toggle }] = useBoolean(false);

  const create = useCallback(async () => {
    await memoService.createMemo();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editorRef.current!.updateContent('');
  }, [memoService]);

  const clear = useCallback(() => {
    runInAction(() => {
      memoService.newContent = '';
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editorRef.current!.updateContent('', false);
  }, [memoService]);

  const markdownEditor = useMemo(() => {
    return (
      <MarkdownEditor
        defaultValue={memoService.newContent}
        ref={editorRef}
        onChange={action((content) => (memoService.newContent = content))}
      />
    );
  }, [memoService]);

  return (
    <div className="box-border flex h-screen flex-col pt-1">
      <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <h1 className="m-0 mr-4 shrink-0 text-base">思考碎片</h1>
          <Search />
        </div>
      </div>
      <Operations toggle={toggle} isExpanded={isExpanded} />
      {isExpanded && (
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
      )}
      <List />
    </div>
  );
});
