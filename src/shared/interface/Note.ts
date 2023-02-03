import { union, boolean, number, object, string, null as zodNull, type infer as Infer } from 'zod';
import dayjs from 'dayjs';

export const noteDTOSchema = object({
  title: string().optional(),
  isReadonly: boolean().optional(),
  userUpdatedAt: number().optional(),
  userCreatedAt: number().optional(),
  parentId: union([zodNull(), string()]).optional(),
  icon: union([string().regex(/^(emoji:|file:).+/), zodNull()]).optional(),
  duplicateFrom: string().optional(),
});

export type NoteDTO = Infer<typeof noteDTOSchema>;

export type NoteVO = Omit<Required<NoteDTO>, 'duplicateFrom'> & {
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

export function normalizeTitle(note: NoteVO) {
  return note.title || `未命名笔记-${dayjs.unix(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
