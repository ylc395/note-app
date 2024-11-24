import { boolean, literal, number, object, union, type infer as ZodInfer } from 'zod';
import UIState from '../../abstract/UIState';

const schema = object({
  scrollTop: number(),
  order: union([literal('asc'), literal('desc')]),
  /* 一级列表有以下值 */
  calendar: boolean(),
}).partial();

type ListViewUIState = ZodInfer<typeof schema>;

export type Order = NonNullable<ListViewUIState['order']>;

export function create(id: string) {
  return new UIState(`memo-list-${id}`, schema);
}
