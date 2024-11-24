import { boolean, number, object, tuple, unknown } from 'zod';
import UIState from '../../abstract/UIState';

const schema = object({
  isReadonly: boolean(),
  scrollTop: number(),
  selection: unknown(),
  titleSelection: tuple([number(), number()]),
}).partial();

export function create(id: string) {
  return new UIState(`note-editor-${id}`, schema);
}
