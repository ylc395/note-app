import { object, union, string, type infer as Infer, instanceof as zodInstanceof } from 'zod';
import type { EntityId } from './entity';

export interface FileVO {
  id: EntityId;
  mimeType: string;
  size: number;
}

export type WebFileMetadataVO = Omit<FileVO, 'id'>;

const urlSchema = object({
  url: string().url(),
});

const fileDTOSchema = union([
  object({
    mimeType: string(),
    data: union([zodInstanceof(ArrayBuffer), string()]).optional(),
    path: string().optional(),
    name: string().optional(),
  }),
  urlSchema,
]);

export type FileDTO = Infer<typeof fileDTOSchema>;
export type FileUrlDTO = Infer<typeof urlSchema>;

export const filesDTOSchema = fileDTOSchema.array();

export type FilesDTO = Infer<typeof filesDTOSchema>;
