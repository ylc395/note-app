import { object, string, array, type infer as Infer, instanceof as zodInstanceof, union, enum as zodEnum } from 'zod';
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

export const httpFileRequestSchema = object({
  url: string().url(),
  type: zodEnum(['arrayBuffer', 'text']),
});

export const httpFileMetadataRequestSchema = httpFileRequestSchema.pick({ url: true });

export type HttpFileMetadataRequest = Infer<typeof httpFileMetadataRequestSchema>;

export interface HttpFileMetadata {
  mimeType: string;
}

export type HttpFileRequest = Infer<typeof httpFileRequestSchema>;

export interface HttpFile<T = unknown> {
  status: number;
  headers: Record<string, string>;
  body: T | null;
}
