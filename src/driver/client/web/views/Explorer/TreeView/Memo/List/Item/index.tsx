import { observer } from 'mobx-react-lite';
import assert from 'assert';
import { MessageSquareMoreIcon, PlusIcon } from 'lucide-react';

import Body from './Body';
import ChildrenList from './ChildrenList';
import type MemoTreeNode from '@domain/client/app/model/memo/TreeNode';
import Button from '@web/components/Button';
import Header from './Header';

const ListItem = observer(function ({ node }: { node: MemoTreeNode }) {
  assert(node.memo);

  return (
    <div className="mb-4 rounded-xl bg-white shadow border-layout border-solid border p-2 group">
      <Header node={node} />
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
