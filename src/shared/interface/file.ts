import { object, union, string, type infer as Infer, instanceof as zodInstanceof } from 'zod';
import type { EntityId } from './entity';

export interface FileVO {
  id: EntityId;
  mimeType: string;
  size: number;
}

export type WebFileMetadataVO = Omit<FileVO, 'id'>;

export const filesDTOSchema = union([
  object({
    mimeType: string(),
    data: zodInstanceof(ArrayBuffer),
  }),
  string().url(),
]).array();

export type FilesDTO = Infer<typeof filesDTOSchema>;
