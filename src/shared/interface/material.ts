import { object, string, infer as Infer } from 'zod';
import type { EntityId } from './entity';

export const directoryDTOSchema = object({
  name: string().optional(),
  parentId: string().optional(),
  icon: string().optional(),
});

export type DirectoryDTO = Infer<typeof directoryDTOSchema>;

export interface MaterialMetadata {
  id: EntityId;
  name: string;
  mimeType: string;
  sourceUrl: string | null;
  createdAt: number;
  updatedAt: number;
  icon: string | null;
  parentId: DirectoryVO['id'] | null;
}

export type DirectoryVO = Omit<MaterialMetadata, 'mimeType' | 'sourceUrl' | 'updatedAt' | 'createdAt'>;

export type TextMaterialBodyVO = string;

export interface TextMaterialCommentVO {
  position: number;
  content: string;
}
