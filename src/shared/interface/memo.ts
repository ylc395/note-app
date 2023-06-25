import { boolean, infer as Infer, number, object, string } from 'zod';
import { entityId, type EntityId } from './entity';
import { type PaginationEntity, type PaginationQuery, paginationQuerySchema } from './pagination';
import type { Starable } from './star';

export type ChildMemoVO = Starable & {
  id: EntityId;
  content: string;
  updatedAt: number;
  createdAt: number;
};

export type ParentMemoVO = ChildMemoVO & {
  threads: ChildMemoVO[];
  isPinned: boolean;
};

export type MemoVO = ChildMemoVO | ParentMemoVO;

export type PaginationMemeVO = PaginationEntity<ParentMemoVO>;

export type MemoPaginationQuery = PaginationQuery;

export const memoQuerySchema = paginationQuerySchema;

export const memoDTOSchema = object({
  content: string().min(1),
  isPinned: boolean().optional(),
  parentId: entityId().optional(),
});

export const memoPatchDTOSchema = memoDTOSchema.omit({ parentId: true }).partial();

export type MemoDTO = Infer<typeof memoDTOSchema>;
export type MemoPatchDTO = Infer<typeof memoPatchDTOSchema>;
