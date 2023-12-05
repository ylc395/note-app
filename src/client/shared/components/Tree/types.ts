import type { ReactNode } from 'react';

import type { HierarchyEntity } from '@shared/domain/model/entity';
import type { default as TreeModel, TreeNode } from '../../domain/model/abstract/Tree';

interface TreeBaseProps<T extends HierarchyEntity> {
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
  onContextmenu?: (id: TreeNode['id']) => void;
  renderTitle?: (node: TreeNode<T>) => ReactNode;
}

export interface TreeNodeProps<T extends HierarchyEntity> extends TreeBaseProps<T> {
  node: TreeNode<T>;
  level: number;
}

export interface TreeProps<T extends HierarchyEntity> extends TreeBaseProps<T> {
  className?: string;
  rootTitle?: string;
}
