import type { NoteTreeNode } from './type';

export const VIRTUAL_ROOT_NODE_KEY = 'root';

export enum SortBy {
  Title = 'title',
  UpdatedAt = 'updatedAt',
  CreatedAt = 'createdAt',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export function getVirtualRoot(id: symbol): NoteTreeNode {
  return {
    key: VIRTUAL_ROOT_NODE_KEY,
    title: '根',
    children: [],
    isLeaf: false,
    treeId: id,
    isExpanded: true,
    isLoaded: true,
    note: {
      id: '',
      title: '',
      isReadonly: true,
      parentId: null,
      icon: null,
      childrenCount: 0,
      updatedAt: 0,
      userCreatedAt: 0,
      createdAt: 0,
      userUpdatedAt: 0,
      isStar: false,
      attributes: {},
    },
  };
}
