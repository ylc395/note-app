import { useEffect, useRef } from 'react';
import { container } from 'tsyringe';
import { Button } from 'antd';
import { observer } from 'mobx-react-lite';

import MemoService from 'service/MemoService';
import MarkdownEditor from 'web/components/MarkdownEditor';

export default observer(function NewMemo() {
  const memoService = container.resolve(MemoService);
  // const markdownEditorRef = useRef<EditorRef>(null);
  // const create = async () => {
  //   await memoService.createMemo();
  //   markdownEditorRef.current!.setContent('');
  // };

  // const clear = () => {
  //   memoService.updateNewContent('');
  //   markdownEditorRef.current!.setContent('');
  // };

  // useEffect(() => {
  //   markdownEditorRef.current!.setContent(memoService.newContent);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <div className="mt-2 bg-white px-2 pb-2">
      {/* <div className="h-20 cursor-text border border-solid border-gray-300 p-1 text-sm">
        <MarkdownEditor onChange={memoService.updateNewContent} />
      </div>
      <div className="mt-2 text-right">
        <Button disabled={!memoService.newContent} onClick={clear} size="small" className="mr-2">
          清除
        </Button>
        <Button disabled={!memoService.newContent} size="small" onClick={create} type="primary">
          创建
        </Button>
      </div> */}
    </div>
  );
});
