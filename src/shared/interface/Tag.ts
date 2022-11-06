import { object, string, number, nativeEnum, type infer as Infer } from 'zod';

export interface TagVO {
  id: number;
  name: string;
  parentId?: TagVO['id'];
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

export const tagDTOSchema = object({
  name: string()
    .min(1, '标签名不应为空')
    .regex(/^[^,]*$/, '标签名不能包含,'),
  parentId: number().optional(),
  type: nativeEnum(TagTypes),
});

export type TagDTO = Infer<typeof tagDTOSchema>;
