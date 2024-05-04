import { observer } from 'mobx-react-lite';
import assert from 'assert';

import type MemoTreeNode from '@domain/client/app/model/memo/TreeNode';
import Body from './Body';
import ChildrenList from './ChildrenList';
import Header from './Header';
import Operation from './Operation';

const ListItem = observer(function ({ node }: { node: MemoTreeNode }) {
  assert(node.memo);

  return (
    <div className="mb-4 rounded-xl bg-white shadow border-layout border-solid border group">
      <div className="px-2 pt-1">
        <Header node={node} />
        <Body node={node} />
      </div>
      {!node.isLeaf && <Operation node={node} />}
      {node.isExpanded && <ChildrenList node={node} />}
    </div>
  );
});

export default ListItem;
