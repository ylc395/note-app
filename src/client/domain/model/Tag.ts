import type { TagVO } from 'interface/Tag';

interface TagTreeNode {
  id: TagVO['id'];
  name: TagVO['name'];
  children: TagTreeNode[];
}

export type TagTree = TagTreeNode[];
