import type { EntityId, EntityLocator } from '@domain/shared/model/entity.js';
import type { FragmentSelector } from './annotation.js';

export * from '@domain/shared/model/content.js';

export enum EventNames {
  ContentUpdated = 'content.updated',
}

export interface ContentUpdatedEvent extends EntityLocator {
  body?: string;
  title?: string;
  updatedAt: number;
}

export type EventMaps = {
  [EventNames.ContentUpdated]: ContentUpdatedEvent;
};

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
