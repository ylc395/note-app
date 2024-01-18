import { object, string, type infer as Infer } from 'zod';

export const clientMaterialQuerySchema = object({
  parentId: string().nullable().optional(),
  to: string().optional(),
  fileHash: string().optional(),
});

export type ClientMaterialQuery = Infer<typeof clientMaterialQuerySchema>;
