import { Input, Space, Button, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { type ChangeEvent, useCallback } from 'react';
import { InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';

import type NoteEditor from 'model/note/Editor';

export default observer(function NoteTitle({ editor }: { editor: NoteEditor }) {
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => editor?.updateTitle(e.target.value), [editor]);

  return (
    <div className="flex items-center border-0 border-b border-solid border-gray-200">
      {editor.entity && (
        <Input
          className="border-none py-2 text-lg font-semibold"
          placeholder={editor.title}
          value={editor.entity.metadata.title}
          onChange={handleChange}
        />
      )}
      <Space.Compact>
        <Tooltip title="搜索">
          <Button type="text" icon={<SearchOutlined />} />
        </Tooltip>
        <Tooltip title="信息与统计">
          <Button type="text" icon={<InfoCircleOutlined />} />
        </Tooltip>
      </Space.Compact>
    </div>
  );
});
