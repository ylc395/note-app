import type { EntityParentId } from './entity.js';
import { MimeTypes } from './file.js';

export interface Memo {
  id: string;
  parentId: EntityParentId;
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
}

/**
 * @api
 */
export type MemoPatchDTO = Partial<Pick<MemoDTO, 'body'>>;

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

/**
 * @api
 */
export type ClientMemoQuery = {
  limit?: number;
  order?: 'asc' | 'desc';
  parentId?: EntityParentId;
  durations?: Duration[];
  endId?: Memo['id'];
  isPinned?: boolean;
  startId?: Memo['id'];
};
