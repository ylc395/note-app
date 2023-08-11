import { boolean, infer as Infer, object, string } from 'zod';
import type { EntityId } from './entity';
import type { Starable } from './star';

export interface ChildMemoVO extends Starable {
  id: EntityId;
  content: string;
  updatedAt: number;
  createdAt: number;
}

export interface ParentMemoVO extends ChildMemoVO {
  threads: ChildMemoVO[];
  isPinned: boolean;
}

export type MemoVO = ChildMemoVO | ParentMemoVO;

export const memoDTOSchema = object({
  content: string().min(1),
  isPinned: boolean().optional(),
  parentId: string().optional(),
});

export const memoPatchDTOSchema = memoDTOSchema.omit({ parentId: true }).partial();

export type MemoDTO = Infer<typeof memoDTOSchema>;
export type MemoPatchDTO = Infer<typeof memoPatchDTOSchema>;
