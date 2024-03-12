import { object, string, type infer as ZodInfer } from 'zod';
import type { EntityId } from './entity.js';

export interface Version {
  id?: string;
  comment: string;
  entityId: EntityId;
  device: string;
  diff: string;
  isAuto: boolean;
  createdAt: number;
}

export const versionDTOSchema = object({
  entityId: string(),
  comment: string().optional(),
});

export type VersionDTO = ZodInfer<typeof versionDTOSchema>;

export type VersionVO = Required<Version>;
