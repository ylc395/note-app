import type { EntityId } from '#domain/shared/model/entity.js';
import type { TextLocation } from '#domain/shared/model/content.js';

export * from '#domain/shared/model/content.js';

export interface TopicRecord {
  entityId: EntityId;
  name: string;
  location: TextLocation;
}

export enum LinkTargetType {
  Entity,
  File,
  External,
}

export interface LinkRecord {
  sourceId: EntityId;
  sourceLocation: TextLocation;
  target: string; // entity id / file id / url
  targetType: LinkTargetType;
  targetDomain: string | null; // 当且仅当 target 为 url 时有值
  targetFragmentId: string | null;
}
