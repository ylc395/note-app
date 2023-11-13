import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';

import type { TreeNode } from 'model/abstract/Tree';
import { IS_DEV } from 'infra/constants';
import IconTitle from 'web/components/IconTitle';

export interface Props {
  node: TreeNode<{ icon: string | null }>;
  children?: ReactNode;
}

export default observer(function NodeTitle({ node, children }: Props) {
  return (
    <span className="flex">
      <IconTitle
        titleClassName="text-gray-600"
        icon={node.attributes?.icon}
        title={`${IS_DEV ? `${node.id.slice(0, 3)} ` : ''}${node.title}`}
      />
      {children && (
        <span className="invisible absolute inset-y-0 right-0 flex h-full items-center text-black group-hover:visible">
          {children}
        </span>
      )}
    </span>
  );
});
