import { createContext, type ReactNode } from 'react';
import type { TreeNode, Tree } from 'model/abstract/Tree';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ITreeContext<T extends TreeNode<any> = TreeNode<any>> {
  titleRender?: (node: T) => ReactNode;
  onContextmenu?: (node: T) => Promise<void> | void;
  onExpand?: (node: T) => void;
  onSelect?: (node: T, isMultiple: boolean) => void;
  draggable?: boolean;
  multiple?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tree: Tree<any>;
  id: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TreeContext = createContext<ITreeContext>(undefined as any);
