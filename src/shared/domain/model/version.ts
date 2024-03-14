import { number, object, string, type infer as ZodInfer } from 'zod';
import type { EntityId } from './entity.js';

export interface Version {
  id?: string;
  comment: string;
  entityId: EntityId;
  device: string;
  diff: string;
  isAuto: boolean;
  index: number;
  createdAt: number;
}

export const versionDTOSchema = object({
  entityId: string(),
  comment: string().optional(),
});

export const versionMergeRequestSchema = object({
  entityId: string(),
  startIndex: number(),
  endIndex: number(),
  comment: string().optional(),
});

export type VersionMergeRequest = ZodInfer<typeof versionMergeRequestSchema>;

export type VersionDTO = ZodInfer<typeof versionDTOSchema>;

export type VersionVO = Omit<Version, 'id'>;
