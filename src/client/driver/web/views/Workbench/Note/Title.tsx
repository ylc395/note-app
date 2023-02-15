import { Input, Space, Button, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { type ChangeEvent, useCallback } from 'react';
import { SettingOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';

import { normalizeTitle } from 'interface/Note';
import type NoteEditor from 'model/editor/NoteEditor';

export default observer(function NoteTitle({ editor }: { editor: NoteEditor }) {
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => editor?.saveTitle(e.target.value), [editor]);

  return (
    <div className="flex items-center border-0 border-gray-200 border-b border-solid">
      <Input
        className="font-semibold text-lg border-none py-2"
        placeholder={editor.note ? normalizeTitle(editor.note) : ''}
        value={editor.note?.title}
        onChange={handleChange}
      />
      <Space.Compact>
        <Tooltip title="搜索">
          <Button type="text" icon={<SearchOutlined />} />
        </Tooltip>
        <Tooltip title="信息与统计">
          <Button type="text" icon={<InfoCircleOutlined />} />
        </Tooltip>
        <Tooltip title="设置笔记工作台">
          <Button type="text" icon={<SettingOutlined />} />
        </Tooltip>
      </Space.Compact>
    </div>
  );
});
