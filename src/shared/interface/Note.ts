import { union, boolean, number, object, string, null as zodNull, type infer as Infer } from 'zod';

export const noteDTOSchema = object({
  title: string().optional(),
  isReadonly: boolean().optional(),
  userUpdatedAt: number().optional(),
  userCreatedAt: number().optional(),
  parentId: union([zodNull(), string()]).optional(),
  icon: union([string().regex(/^(emoji:|file:).+/), zodNull()]).optional(),
});

export type NoteDTO = Infer<typeof noteDTOSchema>;

export type NoteVO = Required<NoteDTO> & {
  id: string;
  childrenCount: number;
  updatedAt: number;
  createdAt: number;
};

export const noteQuerySchema = object({
  parentId: union([zodNull(), string()]).optional(),
  id: string().optional(),
});

export type NoteBodyDTO = string;

export type NoteBodyVO = NoteBodyDTO;

export type NoteQuery = Infer<typeof noteQuerySchema>;
