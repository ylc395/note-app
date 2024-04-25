import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import assert from 'assert';
import { PinIcon, EllipsisIcon, MessageSquareMoreIcon, PlusIcon } from 'lucide-react';

import Body from './Body';
import ChildrenList from './ChildrenList';
import type MemoTreeNode from '@domain/app/model/memo/TreeNode';
import MenuButton from '@web/components/MenuButton';
import Button from '@web/components/Button';
import { noop } from 'lodash-es';

const ListItem = observer(function ({ node }: { node: MemoTreeNode }) {
  assert(node.memo);

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
            { label: '查看详情', onSelect: noop },
            { type: 'separator' },
            { label: '编辑', onSelect: node.startEditing },
            { label: node.memo.isPinned ? '取消置顶' : '置顶', onSelect: node.togglePinned },
            { type: 'separator' },
            { label: '删除', onSelect: noop },
          ]}
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
