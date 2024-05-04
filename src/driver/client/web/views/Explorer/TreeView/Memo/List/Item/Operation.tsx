import { observer } from 'mobx-react-lite';
import assert from 'assert';
import { ArrowDownLeftFromSquare, MessageSquarePlusIcon } from 'lucide-react';

import type MemoTreeNode from '@domain/client/app/model/memo/TreeNode';
import Button from '@web/components/Button';

export default observer(function Operation({ node }: { node: MemoTreeNode }) {
  assert(node.memo);

  return (
    <div className="flex opacity-60 border-t border-solid border-0 border-layout">
      {!node.isLeaf && (
        <Button
          size="small"
          className="grow border-r border-solid border-0  border-layout"
          onClick={node.toggleExpand}
          icon={<MessageSquarePlusIcon className="mr-1" />}
        >
          {node.memo.childrenCount > 0 ? node.memo.childrenCount : null}
        </Button>
      )}
      <Button size="small" className="grow" icon={<ArrowDownLeftFromSquare className="mr-1" />}>
        {node.memo.referrersCount}
      </Button>
    </div>
  );
});
