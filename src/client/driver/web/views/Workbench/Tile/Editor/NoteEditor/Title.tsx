import { Input, Space, Button, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { type ChangeEvent, useContext } from 'react';
import { InfoCircleOutlined, FileSearchOutlined } from '@ant-design/icons';

import EditorContext from './Context';

export default observer(function NoteTitle() {
  const { editor, infoModal } = useContext(EditorContext);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => editor.updateTitle(e.target.value);

  return (
    <div className="flex items-center border-0 border-b border-solid border-gray-200">
      <Input
        className="border-none py-2 text-lg font-semibold"
        placeholder={editor.title || editor.tabView.title}
        value={editor.title}
        onChange={handleChange}
        disabled={typeof editor.title !== 'string'}
      />
      <Space.Compact className="mr-4">
        <Tooltip title="搜索">
          <Button onClick={editor.toggleSearch} type="text" icon={<FileSearchOutlined />} />
        </Tooltip>
        <Tooltip title="信息与统计">
          <Button onClick={infoModal.open} type="text" icon={<InfoCircleOutlined />} />
        </Tooltip>
      </Space.Compact>
    </div>
  );
});