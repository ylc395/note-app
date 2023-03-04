export interface TreeNode {
  key: string;
  title: string;
  parent?: this;
  children: this[];
  isLeaf: boolean;
  disabled?: boolean;
}
