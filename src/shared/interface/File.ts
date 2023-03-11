import { object, string, array, type infer as Infer, instanceof as zodInstanceof, union } from 'zod';
import type { EntityId } from './Entity';

export interface FileVO {
  id: EntityId;
  sourceUrl: string | null;
  mimeType: string;
  size: number;
  name: string;
  createdAt: number;
}

export type FileUrl = string;

export type FileUploadResponse = (FileVO | FileUrl)[];

export const filesDTOSchema = object({
  files: union([
    array(string()),
    array(
      object({
        name: string(),
        data: zodInstanceof(ArrayBuffer),
        mimeType: string(),
      }),
    ),
  ]),
});

export type FilesDTO = Infer<typeof filesDTOSchema>;

export const isUrls = (v: unknown): v is FileUrl[] => Array.isArray(v) && v.every((_v) => typeof _v === 'string');
