import { object, string, array, type infer as Infer, instanceof as zodInstanceof, union, enum as zodEnum } from 'zod';
import type { EntityId } from './entity';

export interface ResourceVO {
  id: EntityId;
  sourceUrl: string | null;
  mimeType: string;
  size: number;
  name: string;
  createdAt: number;
}

export type ResourceUrl = string;

export type ResourceUploadResponse = (ResourceVO | ResourceUrl)[];

export const resourcesDTOSchema = object({
  files: union([
    array(string()),
    array(
      object({
        name: string(),
        data: zodInstanceof(ArrayBuffer),
        mimeType: string().min(1),
      }),
    ),
  ]),
});

export type ResourcesDTO = Infer<typeof resourcesDTOSchema>;

export const isUrls = (v: unknown): v is ResourceUrl[] => Array.isArray(v) && v.every((_v) => typeof _v === 'string');

export const webResourceRequestSchema = object({
  url: string().url(),
  type: zodEnum(['arrayBuffer', 'text']),
});

export const webResourceMetadataRequestSchema = webResourceRequestSchema.pick({ url: true });

export type WebResourceMetadataRequest = Infer<typeof webResourceMetadataRequestSchema>;

export interface WebResourceMetadata {
  mimeType: string;
}

export type WebResourceRequest = Infer<typeof webResourceRequestSchema>;

export interface WebResource<T = unknown> {
  status: number;
  headers: Record<string, string>;
  body: T | null;
}
