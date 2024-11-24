import { number, object, string, infer as ZodInfer } from 'zod';
import UIState from '../UIState';

export const uiStateSchema = object({
  scroll: object({ x: number(), y: number() }),
  expanded: string().array(),
  selected: string().array(),
}).partial();

export type ExplorerUIState = ZodInfer<typeof uiStateSchema>;

export function create(id: string) {
  return new UIState(`explorer-${id}`, uiStateSchema);
}
