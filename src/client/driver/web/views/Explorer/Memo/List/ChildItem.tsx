import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { container } from 'tsyringe';
import dayjs from 'dayjs';
import { Dropdown, Button, type MenuProps } from 'antd';
import { MoreOutlined, StarOutlined, EditOutlined, DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { useBoolean } from 'ahooks';

import type { ChildMemoVO } from 'interface/Memo';
import MemoService from 'service/MemoService';
import Editable from './Editable';

const menuItems: NonNullable<MenuProps['items']> = [
  { label: '编辑', key: 'edit', icon: <EditOutlined /> },
  { label: '收藏', key: 'star', icon: <StarOutlined /> },
  { label: '提取为新的思考碎片', key: 'extract', icon: <FileAddOutlined /> },
  { type: 'divider' },
  { label: '删除', key: 'remove', icon: <DeleteOutlined /> },
];

export default observer(function ChildItem({ memo }: { memo: ChildMemoVO }) {
  const [isEditing, { setTrue: startEditing, setFalse: stopEditing }] = useBoolean(false);
  const memoService = container.resolve(MemoService);

  const submit = useCallback(
    async (content: string) => {
      await memoService.updateContent(memo, content);
      stopEditing();
    },
    [memo, memoService, stopEditing],
  );

  const onClickMenu = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      switch (key) {
        case 'edit':
          startEditing();
          break;
        default:
          break;
      }
    },
    [startEditing],
  );
  return (
    <div>
      <div className="flex justify-between">
        <time>{dayjs.unix(memo.createdAt).format('YYYY-MM-DD HH:mm:ss')}</time>
        <Dropdown trigger={['click']} menu={{ items: menuItems, onClick: onClickMenu }} placement="bottomRight">
          <Button size="small" type="text" icon={<MoreOutlined />} />
        </Dropdown>
      </div>
      <Editable isEditing={isEditing} content={memo.content} onCancel={stopEditing} onSubmit={submit} />
    </div>
  );
});