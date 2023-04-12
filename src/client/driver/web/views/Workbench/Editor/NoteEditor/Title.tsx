import { Input, Space, Button, Tooltip, Badge } from 'antd';
import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { type ChangeEvent, useCallback, useEffect } from 'react';
import { InfoCircleOutlined, SearchOutlined, BugOutlined } from '@ant-design/icons';

import type NoteEditor from 'model/note/Editor';
import EditorService from 'service/EditorService';

export default observer(function NoteTitle({ editor }: { editor: NoteEditor }) {
  const { lint } = container.resolve(EditorService);
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => editor?.updateMetadata({ title: e.target.value }, true),
    [editor],
  );

  useEffect(() => {
    lint(editor);
  }, [editor, lint]);

  return (
    <div className="flex items-center border-0 border-b border-solid border-gray-200">
      <Input
        className="border-none py-2 text-lg font-semibold"
        placeholder={editor.tabView.title}
        value={editor.entity?.metadata.title}
        onChange={handleChange}
        disabled={!editor.entity}
      />
      <Space.Compact className="mr-4">
        <Tooltip title="信息与统计">
          <Button type="text" icon={<InfoCircleOutlined />} />
        </Tooltip>
        <Tooltip title="拼写与格式">
          <Badge showZero size="small" count={editor.lintProblems.length}>
            <Button type="text" icon={<BugOutlined />} />
          </Badge>
        </Tooltip>
      </Space.Compact>
    </div>
  );
});
