import { observer } from 'mobx-react-lite';
import assert from 'assert';
import { EllipsisIcon, PinIcon } from 'lucide-react';
import { noop } from 'lodash-es';
import dayjs from 'dayjs';

import type MemoTreeNode from '@domain/client/app/model/memo/TreeNode';
import MenuButton from '@web/components/MenuButton';
import StarManager from '@domain/client/app/model/StarManager';
import { container } from 'tsyringe';

export default observer(function Header({ node }: { node: MemoTreeNode }) {
  const { star, unstar } = container.resolve(StarManager);
  const { memo } = node;

  assert(memo);

  return (
    <div className="flex justify-between items-center mb-4 text-xs text-text-secondary">
      <div className="flex items-center">
        {memo.isPinned && (
          <span className="mr-1 flex items-center">
            <PinIcon className="w-3 mr-[2px]" /> 置顶 ·{' '}
          </span>
        )}
        <time>{dayjs(memo.createdAt).format('YYYY-MM-DD HH:mm:ss')}</time>
      </div>
      <MenuButton
        button={{ icon: <EllipsisIcon /> }}
        menuItems={[
          { label: '编辑', onSelect: node.startEditing },
          { label: memo.isPinned ? '取消置顶' : '置顶', onSelect: node.togglePinned },
          memo.isStar
            ? { label: '取消收藏', onSelect: () => unstar(memo.id) }
            : { label: '收藏', onSelect: () => star(memo.id) },
          { type: 'separator' },
          { label: '删除', onSelect: noop },
        ]}
      />
    </div>
  );
});
