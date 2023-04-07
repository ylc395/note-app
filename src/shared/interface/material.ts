import { object, string, infer as Infer } from 'zod';
import type { EntityId } from './entity';

export const directoryDTOSchema = object({
  name: string().optional(),
  parentId: string().optional(),
  icon: string().optional(),
});

export type DirectoryDTO = Infer<typeof directoryDTOSchema>;

export interface DirectoryVO {
  id: EntityId;
  name: string;
  icon: string | null;
  parentId: DirectoryVO['id'] | null;
  childrenCount: number;
}

export type MaterialVO = Omit<DirectoryVO, 'childrenCount'> & {
  mimeType: string;
  sourceUrl: string | null;
  createdAt: number;
  updatedAt: number;
};

export const isDirectory = (entity: MaterialVO | DirectoryVO): entity is DirectoryVO => {
  return 'childrenCount' in entity;
};

export type TextMaterialBodyVO = string;

export interface TextMaterialCommentVO {
  position: number;
  content: string;
}
