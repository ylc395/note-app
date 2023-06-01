import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { Tag, Dropdown, Button, Tooltip, type MenuProps } from 'antd';
import dayjs from 'dayjs';
import {
  MoreOutlined,
  StarOutlined,
  EditOutlined,
  DeleteOutlined,
  PushpinOutlined,
  PlusOutlined,
  BookOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useCallback } from 'react';
import { useBoolean } from 'ahooks';

import type { ParentMemoVO } from 'interface/Memo';
import MemoService from 'service/MemoService';
import ChildItem from './ChildItem';
import Editable from './Editable';

const menuItems: NonNullable<MenuProps['items']> = [
  { label: '编辑', key: 'edit', icon: <EditOutlined /> },
  { label: '收藏', key: 'star', icon: <StarOutlined /> },
  { label: '置顶', key: 'pin', icon: <PushpinOutlined /> },
  { type: 'divider' },
  { label: '转为笔记', key: 'toNote', icon: <BookOutlined /> },
  { label: '转为素材', key: 'toMaterial', icon: <DatabaseOutlined /> },
  { type: 'divider' },
  { label: '删除', key: 'remove', icon: <DeleteOutlined /> },
];

export default observer(function ({ memo }: { memo: ParentMemoVO }) {
  const memoService = container.resolve(MemoService);
  const [isCreatingChild, { setTrue: startCreatingChild, setFalse: stopCreatingChild }] = useBoolean(false);
  const [isEditing, { setTrue: startEditing, setFalse: stopEditing }] = useBoolean(false);

  const onClickMenu = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      switch (key) {
        case 'pin':
          memoService.toggleMemoPin(memo);
          break;
        case 'edit':
          startEditing();
          break;
        default:
          break;
      }
    },
    [memo, memoService, startEditing],
  );

  const submit = useCallback(
    async (content: string) => {
      await memoService.updateContent(memo, content);
      stopEditing();
    },
    [memo, memoService, stopEditing],
  );

  const submitChild = useCallback(
    async (content: string) => {
      await memoService.createMemo({ content, parent: memo });
      stopCreatingChild();
    },
    [memo, memoService, stopCreatingChild],
  );

  return (
    <div className="mb-4 border border-solid border-gray-100 bg-white p-2 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          {memo.isPinned && <Tag>置顶</Tag>}
          <span className="text-sm text-gray-600">{dayjs.unix(memo.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
        </div>
        <div>
          <Tooltip title="创建子碎片">
            <Button
              disabled={isCreatingChild}
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={startCreatingChild}
            />
          </Tooltip>
          <Dropdown trigger={['click']} menu={{ items: menuItems, onClick: onClickMenu }} placement="bottomRight">
            <Button size="small" type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      </div>
      <Editable content={memo.content} onSubmit={submit} onCancel={stopEditing} isEditing={isEditing} />
      {isCreatingChild && <Editable onSubmit={submitChild} onCancel={stopCreatingChild} isEditing />}
      {memo.threads.length > 0 && (
        <div className="pl-4">
          {memo.threads.map((child) => (
            <ChildItem memo={child} key={child.id} />
          ))}
        </div>
      )}
    </div>
  );
});
