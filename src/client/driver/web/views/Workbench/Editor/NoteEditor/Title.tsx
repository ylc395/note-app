import { Input, Space, Button, Tooltip, Badge } from 'antd';
import { observer } from 'mobx-react-lite';
import { type ChangeEvent, useCallback } from 'react';
import { InfoCircleOutlined, BugOutlined, FileSearchOutlined } from '@ant-design/icons';

import type NoteEditor from 'model/note/Editor';
import type { EditorRef } from 'web/components/MarkdownEditor';

export default observer(function NoteTitle({ editor, editorRef }: { editor: NoteEditor; editorRef: EditorRef | null }) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => editor?.updateMetadata({ title: e.target.value }, true),
    [editor],
  );

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
        <Tooltip title="搜索">
          <Button onClick={() => editorRef && editorRef.enableSearch()} type="text" icon={<FileSearchOutlined />} />
        </Tooltip>
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
