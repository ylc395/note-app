import type { ReactNode } from 'react';

import type { HierarchyEntity } from '../../../../shared/model/entity';
import type { default as TreeModel, TreeNode } from '../../model/abstract/Tree';

export interface TreeContext<T extends HierarchyEntity> {
  tree: TreeModel<T>;
  nodeClassName?: string;
  caretClassName?: string;
  titleClassName?: string;
  draggingOverNodeClassName?: string;
  draggingOverTitleClassName?: string;
  emptyChildrenView?: (param: { indent: number }) => ReactNode;
  loadingIcon?: ReactNode;
  draggable?: boolean;
  droppable?: boolean;
  multiple?: boolean;
  renderTitle?: (node: TreeNode<T>) => ReactNode;
}
