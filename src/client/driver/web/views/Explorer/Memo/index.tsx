import { observer } from 'mobx-react-lite';
import { Button, Tooltip } from 'antd';
import { ColumnHeightOutlined, SettingOutlined } from '@ant-design/icons';
import { container } from 'tsyringe';
import { useRef } from 'react';
import { useBoolean } from 'ahooks';

import MarkdownEditor, { type EditorRef } from 'web/components/MarkdownEditor';
import MemoService from 'service/MemoService';
import List from './List';
import Search from './Search';

export default observer(() => {
  const memoService = container.resolve(MemoService);
  const contentRef = useRef('');
  const editorRef = useRef<EditorRef>(null);
  const [isExpanded, { toggle }] = useBoolean(true);

  const create = async () => {
    await memoService.createMemo(contentRef.current);
    contentRef.current = '';
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editorRef.current!.updateContent('');
  };

  return (
    <div className="box-border flex h-screen flex-col pt-1">
      <div className="border-0 border-b  border-solid border-gray-200 bg-white p-2">
        <div className="flex items-center justify-between">
          <h1 className="m-0 mr-4 shrink-0 text-base">思考碎片</h1>
          <Search />
        </div>
      </div>
      <div className="mt-2 flex justify-between">
        <div>
          <Tooltip title={isExpanded ? '收起' : '展开'}>
            <Button type="text" icon={<ColumnHeightOutlined />} onClick={toggle} />
          </Tooltip>
        </div>
        <Tooltip title="视图配置" className="ml-auto">
          <Button type="text" icon={<SettingOutlined />} />
        </Tooltip>
      </div>
      {isExpanded && (
        <div className="mt-2 bg-white px-2 pb-2">
          <div className="h-20 cursor-text border border-solid border-gray-300 p-1 text-sm">
            <MarkdownEditor
              defaultValue={contentRef.current}
              ref={editorRef}
              onChange={(content) => (contentRef.current = content)}
            />
          </div>
          <div className="mt-2 text-right">
            <span className="mr-2 text-xs text-gray-400">Ctrl + Enter 或点击右侧按钮提交</span>
            <Button size="small" onClick={create} type="primary">
              创建
            </Button>
          </div>
        </div>
      )}
      <List />
    </div>
  );
});
