import { object, string, type infer as Infer, instanceof as zodInstanceof } from 'zod';
import type { EntityId } from './entity.js';

export const httpUrlSchema = string()
  .url()
  .refine((str) => /^https?:\/\//.test(str));

const fileDTOSchema = object({
  mimeType: string(),
  data: zodInstanceof(ArrayBuffer).optional(),
  path: string().optional(),
  lang: string(),
});

export const filesDTOSchema = fileDTOSchema.array();

export type FileDTO = Infer<typeof fileDTOSchema>;
export type FilesDTO = Infer<typeof filesDTOSchema>;

export interface FileVO {
  id: EntityId;
  mimeType: string;
  size: number;
  lang: string;
}
