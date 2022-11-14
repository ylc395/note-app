import { object, string, number, type infer as Infer } from 'zod';

export interface TagVO {
  id: number;
  name: string;
  parentId?: TagVO['id'];
}

export interface TagQuery {
  id?: TagVO['id'] | TagVO['id'][];
  name?: string;
}

export const tagDTOSchema = object({
  name: string()
    .min(1, '标签名不应为空')
    .regex(/^[^,]*$/, '标签名不能包含,'),
  parentId: number().optional(),
});

export const tagPatchDTOSchema = object({
  id: number(),
  ...tagDTOSchema.partial().shape,
});

export type TagDTO = Infer<typeof tagDTOSchema>;

export type TagPatchDTO = Infer<typeof tagPatchDTOSchema>;
