import { Input, Space, Button, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { type ChangeEvent, useCallback } from 'react';
import { InfoCircleOutlined, SearchOutlined, BugOutlined } from '@ant-design/icons';

import type NoteEditor from 'model/note/Editor';

export default observer(function NoteTitle({ editor }: { editor: NoteEditor }) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => editor?.updateMetadata({ title: e.target.value }),
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
      <Space.Compact>
        <Tooltip title="信息与统计">
          <Button type="text" icon={<InfoCircleOutlined />} />
        </Tooltip>
        <Tooltip title="拼写与格式">
          <Button type="text" icon={<BugOutlined />} />
        </Tooltip>
      </Space.Compact>
    </div>
  );
});
