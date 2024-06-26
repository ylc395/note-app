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

/**
 * @api
 */
export interface VersionDTO {
  entityId: EntityId;
  comment?: string;
}

/**
 * @api
 */
export interface VersionMergeRequest {
  entityId: EntityId;
  startIndex: number;
  endIndex: number;
  comment?: string;
}

/**
 * @api
 */
export type VersionVO = Omit<Version, 'id'>;
