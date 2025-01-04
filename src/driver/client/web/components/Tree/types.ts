import type { MouseEvent, ReactElement, ReactNode } from 'react';

import type TreeModel from '#domain/client/shared/model/note/Tree';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import type { HierarchyEntity } from '#domain/client/shared/model/entity';

interface TreeBaseProps<T extends HierarchyEntity> {
  tree: TreeModel<T>;
  indent?: number;
  nodeClassName?: string | ((node: TreeNode<T>) => string);
  iconClassName?: string | ((node: TreeNode<T>) => string);
  titleClassName?: string | ((node: TreeNode<T>) => string);
  onContextmenu?: (node: TreeNode<T>, e: MouseEvent) => void;
  onClick?: (node: TreeNode<T>) => void; // 不含多选点击
  renderTitle?: (node: TreeNode<T>) => ReactNode;
  renderNode?: (node: TreeNode<T>, originalNodeView: ReactElement) => ReactNode;
}

export interface TreeNodeProps<T extends HierarchyEntity> extends TreeBaseProps<T> {
  node: TreeNode<T>;
  level: number;
}

export interface TreeProps<T extends HierarchyEntity> extends TreeBaseProps<T> {
  className?: string;
  showRoot?: boolean;
}
