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
} from '@ant-design/icons';
import { useCallback, useEffect, useRef } from 'react';
import { useBoolean } from 'ahooks';

import type { MemoVO } from 'interface/Memo';
import MemoService from 'service/MemoService';
import MarkdownEditor, { type EditorRef } from 'web/components/MarkdownEditor';
import ChildItem from './ChildItem';
import ChildEditor from './ChildEditor';

const menuItems: NonNullable<MenuProps['items']> = [
  { label: '编辑', key: 'edit', icon: <EditOutlined /> },
  { label: '收藏', key: 'star', icon: <StarOutlined /> },
  { label: '置顶', key: 'pin', icon: <PushpinOutlined /> },
  { type: 'divider' },
  { label: '删除', key: 'remove', icon: <DeleteOutlined /> },
];

export default observer(function ({ memo }: { memo: MemoVO }) {
  const memoService = container.resolve(MemoService);
  const editorRef = useRef<EditorRef>(null);
  const [isCreatingChild, { setTrue: startCreatingChild, setFalse: stopCreatingChild }] = useBoolean(false);
  const [isEditing, { setTrue: startEditing, setFalse: stopEditing }] = useBoolean(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    editorRef.current!.updateContent(memo.content);
  }, [memo]);

  const onClickMenu = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      switch (key) {
        case 'pin':
          memoService.toggleMemoPin(memo);
          break;
        case 'edit':
          startEditing();
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          editorRef.current!.updateContent(memo.content, false);
          break;
        default:
          break;
      }
    },
    [memo, memoService, startEditing],
  );

  const submitChild = useCallback(
    async (content: string) => {
      await memoService.createMemo({ parentId: memo.id, content });
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
      <div className="select-text">
        <MarkdownEditor readonly={!isEditing} ref={editorRef} />
      </div>
      {isCreatingChild && <ChildEditor onSubmit={submitChild} onCancel={stopCreatingChild} />}
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
