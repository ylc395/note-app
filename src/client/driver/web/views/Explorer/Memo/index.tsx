import { observer } from 'mobx-react-lite';
import { Button } from 'antd';
import { container } from 'tsyringe';
import { useEffect, useRef } from 'react';

import MarkdownEditor from 'web/components/MarkdownEditor';
import MemoService from 'service/MemoService';

export default observer(() => {
  const memoService = container.resolve(MemoService);
  const contentRef = useRef('');
  const create = () => {
    memoService.createMemo({ content: contentRef.current });
  };

  useEffect(() => {
    memoService.load();
  }, [memoService]);

  return (
    <div className="box-border flex h-screen flex-col pt-1">
      <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-base">思考碎片</h1>
        </div>
      </div>
      <div>
        <div className="h-60 cursor-text border border-solid border-gray-300">
          <MarkdownEditor onChange={(content) => (contentRef.current = content)} />
        </div>
        <div>
          <Button onClick={create} type="primary">
            创建
          </Button>
        </div>
      </div>
      <div>
        {memoService.memos.map((memo) => (
          <div key={memo.id}>{memo.content}</div>
        ))}
      </div>
    </div>
  );
});
