import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';

import { IS_DEV } from '@shared/domain/infra/constants';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import IconTitle from '@web/components/IconTitle';

export interface Props {
  node: TreeNode<any>;
  children?: ReactNode;
}

export default observer(function NodeTitle({ node, children }: Props) {
  return (
    <span className="flex min-w-0">
      <IconTitle
        className="w-full"
        titleClassName="text-gray-600 min-w-0 overflow-hidden text-ellipsis"
        icon={node.icon}
        title={`${IS_DEV ? `${node.id.slice(0, 3)} ` : ''}${node.title}`}
      />
      {children && (
        <span className="invisible absolute inset-y-0 right-0 flex h-full items-center bg-[--hover-color] text-black group-hover:visible group-[[data-selected=true]]:bg-[var(--selected-color)]">
          {children}
        </span>
      )}
    </span>
  );
});
