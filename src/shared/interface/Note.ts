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
  hasChildren: boolean;
  userUpdatedAt: number;
  userCreatedAt: number;
};

export type NoteBodyDTO = string;

export type NoteBodyVO = NoteBodyDTO;

export interface NoteQuery {
  parentId?: NoteVO['parentId'];
  id?: NoteVO['id'];
}
