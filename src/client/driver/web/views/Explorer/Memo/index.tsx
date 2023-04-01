import { observer } from 'mobx-react-lite';
import { Button } from 'antd';
import { container } from 'tsyringe';
import { useRef } from 'react';

import MarkdownEditor, { type EditorRef } from 'web/components/MarkdownEditor';
import MemoService from 'service/MemoService';
import List from './List';

export default observer(() => {
  const memoService = container.resolve(MemoService);
  const contentRef = useRef('');
  const editorRef = useRef<EditorRef>(null);

  const create = async () => {
    await memoService.createMemo({ content: contentRef.current });
    contentRef.current = '';
    editorRef.current?.updateContent('', true);
  };

  return (
    <div className="box-border flex h-screen flex-col pt-1">
      <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-base">思考碎片</h1>
        </div>
      </div>
      <div className="bg-white px-2 pb-2">
        <div className="h-20 cursor-text border border-solid border-gray-300 p-1 text-sm">
          <MarkdownEditor ref={editorRef} onChange={(content) => (contentRef.current = content)} />
        </div>
        <div className="mt-2 text-right">
          <span className="mr-2 text-xs text-gray-400">Ctrl + Enter 或点击右侧按钮提交</span>
          <Button size="small" onClick={create} type="primary">
            创建
          </Button>
        </div>
      </div>
      <List />
    </div>
  );
});
