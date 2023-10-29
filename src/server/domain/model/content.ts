import type { EntityLocator } from 'model/entity';
import type { TopicDTO, LinkDTO, HighlightPosition, InlineTopicDTO, ContentEntityTypes } from 'shared/model/content';

export * from 'shared/model/content';

export type ContentEntityLocator = EntityLocator<ContentEntityTypes>;

export interface ContentUpdatedEvent extends ContentEntityLocator {
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

export function isInlineTopic(t: TopicDTO): t is InlineTopicDTO;
export function isInlineTopic(t: Topic): t is InlineTopic;
export function isInlineTopic(t: Topic | TopicDTO): t is InlineTopic | InlineTopicDTO {
  return 'position' in t;
}

export interface TopicQuery {
  name: string;
}
