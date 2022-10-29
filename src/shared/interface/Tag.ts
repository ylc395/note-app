export interface TagVO {
  id: number;
  name: string;
  parentId: TagVO['id'];
}

export interface TagDTO {
  name: string;
  parentId: TagVO['id'];
}

export enum TagTypes {
  Material = 'material',
}

export interface TagQuery {
  type: TagTypes;
}
