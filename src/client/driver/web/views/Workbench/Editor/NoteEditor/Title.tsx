import { Input, Space, Button, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { type ChangeEvent, useCallback, useContext } from 'react';
import { InfoCircleOutlined, FileSearchOutlined } from '@ant-design/icons';

import EditorContext from './Context';

export default observer(function NoteTitle() {
  const { markdownEditorView, editorView, infoModal } = useContext(EditorContext);
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => editorView.editor.updateNote({ title: e.target.value }),
    [editorView],
  );

  return (
    <div className="flex items-center border-0 border-b border-solid border-gray-200">
      <Input
        className="border-none py-2 text-lg font-semibold"
        placeholder={editorView.tabView.title}
        value={editorView.editor.entity?.metadata.title}
        onChange={handleChange}
        disabled={!editorView.editor.entity}
      />
      <Space.Compact className="mr-4">
        <Tooltip title="搜索">
          <Button onClick={() => markdownEditorView?.enableSearch()} type="text" icon={<FileSearchOutlined />} />
        </Tooltip>
        <Tooltip title="信息与统计">
          <Button onClick={() => infoModal.open()} type="text" icon={<InfoCircleOutlined />} />
        </Tooltip>
      </Space.Compact>
    </div>
  );
});
