export interface TreeNode {
  key: string;
  title: string;
  parent?: this;
  children: this[];
  isLeaf: boolean;
  disabled?: boolean;
}

export interface Tree {
  expandedKeys: Set<TreeNode['key']>;
  selectedKeys: Set<TreeNode['key']>;
  loadedKeys: Set<TreeNode['key']>;
  roots: TreeNode[];
  loadChildren(key?: TreeNode['key']): Promise<void>;
}
