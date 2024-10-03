import type { EntityId } from '@domain/shared/model/entity.js';
import type { FragmentSelector } from './annotation.js';

export * from '@domain/shared/model/content.js';

export interface TopicRecord {
  entityId: EntityId;
  name: string;
  locationStart: number;
  locationEnd: number;
  createdAt: number;
}

export enum LinkTargetType {
  Entity = 1,
  File,
  External,
}

export interface LinkRecord {
  sourceId: EntityId;
  sourceLocationStart: number;
  sourceLocationEnd: number;
  targetId: string;
  targetType: LinkTargetType;
  targetSelector?: FragmentSelector | null; // 从 URL 的 hash 部分解析而来。很可能随着目标的内容的变化而失效
}

export function getTitle(v: unknown) {
  if (typeof v === 'object' && v && 'title' in v && typeof v.title === 'string') {
    return v.title;
  }

  return null;
}

export function getBody(v: unknown) {
  if (typeof v === 'object' && v) {
    if ('body' in v && typeof v.body === 'string') {
      return v.body;
    }

    if ('comment' in v && typeof v.comment === 'string') {
      return v.comment;
    }
  }

  return null;
}
