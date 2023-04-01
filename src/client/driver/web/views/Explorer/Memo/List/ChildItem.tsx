import { observer } from 'mobx-react-lite';
import { useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { Dropdown, Button, type MenuProps } from 'antd';
import { MoreOutlined, StarOutlined, EditOutlined, DeleteOutlined, FileAddOutlined } from '@ant-design/icons';

import type { ChildMemoVO } from 'interface/Memo';
import MarkdownEditor, { type EditorRef } from 'web/components/MarkdownEditor';

const menuItems: NonNullable<MenuProps['items']> = [
  { label: '编辑', key: 'edit', icon: <EditOutlined /> },
  { label: '收藏', key: 'star', icon: <StarOutlined /> },
  { label: '单独发表', key: 'extract', icon: <FileAddOutlined /> },
  { type: 'divider' },
  { label: '删除', key: 'remove', icon: <DeleteOutlined /> },
];

export default observer(function ChildItem({ memo }: { memo: ChildMemoVO }) {
  const editorRef = useRef<EditorRef>(null);

  useEffect(() => {
    editorRef.current?.updateContent(memo.content);
  }, [memo]);

  return (
    <div>
      <div className="flex justify-between">
        <time>{dayjs.unix(memo.createdAt).format('YYYY-MM-DD HH:mm:ss')}</time>
        <Dropdown trigger={['click']} menu={{ items: menuItems }} placement="bottomRight">
          <Button size="small" type="text" icon={<MoreOutlined />} />
        </Dropdown>
      </div>
      <div className="select-text">
        <MarkdownEditor ref={editorRef} readonly />
      </div>
    </div>
  );
});
