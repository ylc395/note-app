import type { Entity, EntityId, EntityParentId } from './entity.js';
import { MimeTypes } from './file.js';

export interface Memo {
  id: string;
  parentId: EntityParentId;
  isPinned: boolean;
  body: string;
  updatedAt: number;
  createdAt: number;
}

/**
 * @api
 */
export interface MemoVO extends Memo {
  isStar: boolean;
  followupsCount: number;
  referrersCount: number;
}

/**
 * @api
 */
export interface MemoDTO {
  parentId?: EntityParentId;
  body: string;
  isPinned?: boolean;
}

/**
 * @api
 */
export type MemoPatchDTO = Partial<Pick<MemoDTO, 'body' | 'isPinned'>>;

/**
 * @api
 */
export interface Duration {
  startTime?: number;
  endTime?: number;
}

export enum FileTypes {
  Image,
  Video,
  Audio,
  Pdf,
  Other,
}
export function getFileType(mimeType: string) {
  if (mimeType.startsWith('image')) {
    return FileTypes.Image;
  }

  if (mimeType.startsWith('video')) {
    return FileTypes.Video;
  }

  if (mimeType.startsWith('audio')) {
    return FileTypes.Audio;
  }

  if (mimeType === MimeTypes.PDF) {
    return FileTypes.Pdf;
  }

  return FileTypes.Other;
}

export interface LinkSet {
  domains: {
    total: number;
    records: Array<{ domain: string; count: number }>;
  };
  files: {
    total: number;
    records: Array<{ type: FileTypes; count: number }>;
  };
  entities: {
    total: number;
    records: Array<{ entity: Entity; count: number }>;
  };
}

/**
 * @api
 */
export type ClientMemoQuery = {
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  parentId?: EntityParentId;
  isPinned?: boolean;
  durations?: Duration[];
  endId?: Memo['id'];
  startId?: Memo['id'];
  topics?: string[];
  keyword?: string;
  links?: {
    entityIds?: EntityId[] | 'all';
    domains?: string[] | 'all';
    fileTypes?: FileTypes[] | 'all';
  };
};

/**
 * @api
 */
export type CountQuery = Pick<ClientMemoQuery, 'durations' | 'topics' | 'links'>;
