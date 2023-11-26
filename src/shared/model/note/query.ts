import { object, string, type infer as Infer } from 'zod';

export const clientNoteQuerySchema = object({
  parentId: string().nullable().optional(),
  to: string().optional(),
});

export type ClientNoteQuery = Infer<typeof clientNoteQuerySchema>;
