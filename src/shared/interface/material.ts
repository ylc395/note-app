import { object, string } from 'zod';
import type { EntityId } from './entity';

export interface MaterialDirectory {
  id: EntityId;
  name: string;
  parentId: MaterialDirectory['id'] | null;
  icon: string;
}

export interface MaterialMetadata {
  id: EntityId;
  name: string;
  mimeType: string;
  sourceUrl: string | null;
  createdAt: number;
  updatedAt: number;
  parentId: MaterialDirectory['id'];
}

export type TextMaterialBodyVO = string;

export interface TextMaterialCommentVO {
  position: number;
  content: string;
}
