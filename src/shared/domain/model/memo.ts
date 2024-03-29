import { object, string, number, infer as Infer, boolean } from 'zod';
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

export const MAX_LENGTH = 10000;

export const memoDTOSchema = object({
  parentId: string().nullish(),
  body: string().max(MAX_LENGTH),
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

export const clientMemoQuerySchema = object({
  limit: number().optional(),
  parentId: string().nullish(),
  before: string().optional(),
  after: string().optional(),
  isPinned: boolean().optional(),
}).merge(durationSchema.partial());

export const clientTreeFragmentQuerySchema = object({
  limit: number(),
  to: string(),
});

export type ClientTreeFragmentQuery = Infer<typeof clientTreeFragmentQuerySchema>;

export type ClientMemoQuery = Infer<typeof clientMemoQuerySchema>;

export interface DateInfo {
  date: string;
  count: number;
}
