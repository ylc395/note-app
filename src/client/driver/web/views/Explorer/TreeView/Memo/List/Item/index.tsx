import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import assert from 'assert';
import { PinIcon, EllipsisIcon, MessageSquareMoreIcon, PlusIcon } from 'lucide-react';

import Body from './Body';
import ChildrenList from './ChildrenList';
import type MemoTreeNode from '@domain/app/model/memo/TreeNode';
import MenuButton from '@web/components/MenuButton';
import Button from '@web/components/Button';

const ListItem = observer(function ({ node }: { node: MemoTreeNode }) {
  assert(node.memo);

  function handleMenuSelect() {}

  return (
    <div className="mb-4 rounded-xl bg-white shadow border-layout border-solid border p-2 group">
      <div className="flex justify-between items-center mb-4 text-xs text-text-secondary">
        <div className="flex items-center">
          {node.memo.isPinned && (
            <span className="mr-1 flex items-center">
              <PinIcon className="w-3 mr-[2px]" /> 置顶 ·{' '}
            </span>
          )}
          <time>{dayjs(node.memo.createdAt).format('YYYY-MM-DD HH:mm:ss')}</time>
        </div>
        <MenuButton
          button={{ icon: <EllipsisIcon /> }}
          menuItems={[
            { key: 'detail', label: '查看详情' },
            { type: 'separator' },
            { key: 'edit', label: '编辑' },
            node.memo.isPinned ? { key: 'unpin', label: '取消置顶' } : { key: 'pin', label: '置顶' },
            { type: 'separator' },
            { key: 'delete', label: '删除' },
          ]}
          onSelect={handleMenuSelect}
        />
      </div>
      <Body node={node} />
      {node.memo.childrenCount > 0 ? (
        <div className="flex items-center text-xs text-text-secondary">
          <MessageSquareMoreIcon className="mr-1" />
          {node.memo.childrenCount} 条后续
        </div>
      ) : (
        <Button block icon={<PlusIcon className="mr-1" />} className="group-hover:visible invisible opacity-60">
          新增子 Memo
        </Button>
      )}
      {node.isExpanded && <ChildrenList node={node} />}
    </div>
  );
});

export default ListItem;
