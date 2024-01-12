import { object, string, type infer as Infer, instanceof as zodInstanceof } from 'zod';
import type { EntityId } from './entity.js';

export const fileDTOSchema = object({
  mimeType: string(),
  data: zodInstanceof(ArrayBuffer).optional(),
  path: string().optional(),
  lang: string().optional(),
});

export type FileDTO = Infer<typeof fileDTOSchema>;

export interface FileVO {
  id: EntityId;
  mimeType: string;
  size: number;
  lang: string;
}
