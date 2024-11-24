import { object, string } from 'zod';
import UIState from '../../abstract/UIState';

const schema = object({
  body: string(),
}).partial();

export function create(id: string) {
  return new UIState(`memo-editor-${id}`, schema);
}
