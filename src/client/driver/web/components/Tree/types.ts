import type { CSSProperties, ReactNode } from 'react';

import type { HierarchyEntity } from '@shared/domain/model/entity';
import type TreeModel from '@domain/common/model/abstract/Tree';
import type TreeNode from '@domain/common/model/abstract/TreeNode';

interface TreeBaseProps<T extends HierarchyEntity> {
  tree: TreeModel<T>;
  nodeClassName?: string | ((node: TreeNode<T>) => string);
  caretClassName?: string | ((node: TreeNode<T>) => string);
  titleClassName?: string | ((node: TreeNode<T>) => string);
  loadingIcon?: ReactNode;
  multiple?: boolean;
  onContextmenu?: (node: TreeNode<T>) => void;
  onClick?: (node: TreeNode<T>) => void;
  renderTitle?: (node: TreeNode<T>) => ReactNode;
  renderNode?: (node: TreeNode<T>, originalNodeView: ReactNode) => ReactNode;
}

export interface TreeNodeProps<T extends HierarchyEntity> extends TreeBaseProps<T> {
  node: TreeNode<T>;
  level: number;
}

export interface TreeProps<T extends HierarchyEntity> extends TreeBaseProps<T> {
  className?: string;
  showRoot?: boolean;
  style?: CSSProperties;
}
