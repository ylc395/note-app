export interface TagVO {
  id: number;
  name: string;
  parentId: TagVO['id'];
}

export interface TagDTO {
  name: string;
  parentId: TagVO['id'];
  type: TagTypes;
}

export enum TagTypes {
  Material = 'material',
}

export interface TagQuery {
  type: TagTypes;
}
