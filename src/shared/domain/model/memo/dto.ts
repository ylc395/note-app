import { boolean, infer as Infer, object, string } from 'zod';

export const memoDTOSchema = object({
  content: string().min(1),
  isPinned: boolean().optional(),
  parentId: string().optional(),
});

export const memoPatchDTOSchema = memoDTOSchema.omit({ parentId: true }).partial();

export type MemoDTO = Infer<typeof memoDTOSchema>;

export type MemoPatchDTO = Infer<typeof memoPatchDTOSchema>;
