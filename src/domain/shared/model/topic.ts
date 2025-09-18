import type { Entity, EntityTypes } from './entity.js';

export interface TopicVO {
  name: string;
  entities: Entity[];
}

/**
 * @api
 */
export interface TopicQuery {
  type?: EntityTypes;
  name?: string;
}

export const TOPIC_SEPARATOR = '/';
