import type { EntityId } from '@domain/model/entity.js';
import type { TopicDTO, LinkDTO, HighlightPosition } from '@shared/domain/model/content.js';

export * from '@shared/domain/model/content.js';

export interface ContentUpdatedEvent {
  entityId: EntityId;
  content: string;
  updatedAt: number;
}

export interface Link extends LinkDTO {
  createdAt: number;
}

export interface Topic extends TopicDTO {
  createdAt: number;
}

export interface InlineTopic extends Topic {
  position: HighlightPosition;
}

export interface TopicQuery {
  name: string;
}
