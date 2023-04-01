import { boolean, infer as Infer, object, string } from 'zod';
import { entityId, type EntityId } from './entity';
import { type PaginationEntity, type PaginationQuery, paginationQuerySchema } from './pagination';
import type { Starable } from './star';

export type ChildMemoVO = Starable & {
  id: EntityId;
  content: string;
  updatedAt: number;
  createdAt: number;
};

export type MemoVO = ChildMemoVO & {
  threads: ChildMemoVO[];
  isPinned: boolean;
};

export type PaginationMemeVO = PaginationEntity<MemoVO>;

export type MemoQuery = PaginationQuery;

export const memoQuerySchema = paginationQuerySchema;

export const memoDTOSchema = object({
  content: string().min(1),
  isPinned: boolean().optional(),
  parentId: entityId().optional(),
});

export const memoPatchDTOSchema = object({
  isPinned: boolean().optional(),
  content: string().optional(),
});

export type MemoDTO = Infer<typeof memoDTOSchema>;
export type MemoPatchDTO = Infer<typeof memoPatchDTOSchema>;
