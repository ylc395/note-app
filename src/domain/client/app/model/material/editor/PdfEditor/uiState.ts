import { object, string } from 'zod';
import UIState from '../../../abstract/UIState';

const schema = object({
  hash: string().nullable(), // pdfjs's hash, including page, scroll position, zoom etc; see https://datatracker.ietf.org/doc/html/rfc8118#section-3
}).partial();

export function create(id: string) {
  return new UIState(`pdf-editor-${id}`, schema);
}
