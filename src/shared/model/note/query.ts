import { object, string, type infer as Infer } from 'zod';

export const clientNoteQuerySchema = object({
  parentId: string().nullable().optional(),
});

export type ClientNoteQuery = Infer<typeof clientNoteQuerySchema>;
