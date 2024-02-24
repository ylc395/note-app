import { object, string, number, infer as Infer, boolean, union } from 'zod';
import type { EntityParentId } from './entity.js';

export interface Memo {
  id: string;
  parentId: EntityParentId;
  isPinned: boolean;
  sourceUrl: string | null;
  body: string;
  updatedAt: number;
  createdAt: number;
}

export interface MemoVO extends Memo {
  isStar: boolean;
  childrenCount: number;
}

export const memoDTOSchema = object({
  parentId: string().nullish(),
  body: string(),
  isPinned: boolean().optional(),
  sourceUrl: string().url().nullish(),
});

export type MemoDTO = Infer<typeof memoDTOSchema>;

export const memoPatchDTOSchema = memoDTOSchema
  .pick({
    body: true,
    isPinned: true,
    sourceUrl: true,
  })
  .partial();

export type MemoPatchDTO = Infer<typeof memoPatchDTOSchema>;

export const durationSchema = object({
  startTime: number(),
  endTime: number(),
});

export type Duration = Infer<typeof durationSchema>;

export const clientMemoQuerySchema = union([
  object({ parentId: string().nullable() }),
  object({
    limit: number().optional(),
  }).merge(durationSchema.partial()),
]);

export type ClientMemoQuery = Infer<typeof clientMemoQuerySchema>;

export interface DateInfo {
  date: string;
  count: number;
}

export const memoSorter = (memo1: Memo, memo2: Memo) => {
  if (memo1.isPinned !== memo2.isPinned) {
    return memo1.isPinned ? -1 : 1;
  }

  return memo2.createdAt - memo1.createdAt;
};
