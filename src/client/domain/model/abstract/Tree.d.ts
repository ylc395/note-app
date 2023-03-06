export interface TreeNode {
  key: string;
  title: string;
  parent?: this;
  children: this[];
  isLeaf: boolean;
  isDisabled?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
  isLoaded?: boolean;
  isUndroppable?: boolean;
}

export interface Tree<T extends TreeNode> {
  roots: T[];
  loadChildren(node?: T): Promise<void>;
}
