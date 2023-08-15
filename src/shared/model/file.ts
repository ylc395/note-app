import { object, union, string, type infer as Infer, instanceof as zodInstanceof } from 'zod';
import type { EntityId } from './entity';
import { APP_NAME } from '../infra/constants';

const FileUrlDTOSchema = object({
  url: string().url(),
});

const fileDTOSchema = union([
  object({
    mimeType: string(),
    data: zodInstanceof(ArrayBuffer).optional(),
    path: string().optional(),
  }),
  FileUrlDTOSchema,
]);

export const filesDTOSchema = fileDTOSchema.array();

export type FileDTO = Infer<typeof fileDTOSchema>;
export type FileUrlDTO = Infer<typeof FileUrlDTOSchema>;
export type FilesDTO = Infer<typeof filesDTOSchema>;

export interface FileVO {
  id: EntityId;
  mimeType: string;
  size: number;
}

export const FILE_URL_PREFIX = `${APP_NAME}://file/`;
