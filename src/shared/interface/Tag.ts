import { object, string, number, nonempty, optional, enums } from 'superstruct';

export interface TagVO {
  id: number;
  name: string;
  parentId: TagVO['id'];
}

export interface TagDTO {
  name: string;
  parentId?: TagVO['id'];
  type: TagTypes;
}

export enum TagTypes {
  Material = 'material',
}

export interface TagQuery {
  id?: TagVO['id'] | TagVO['id'][];
  type?: TagTypes;
  name?: string;
  parentId?: TagVO['id'];
}

export const tagSchema = object({
  name: nonempty(string()),
  parentId: optional(number()),
  type: enums([TagTypes.Material]),
});
