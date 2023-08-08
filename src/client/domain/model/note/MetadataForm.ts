import Form from 'model/abstract/Form';
import type { NoteDTO } from 'interface/note';

export interface NoteMetadata {
  icon: NonNullable<NoteDTO['icon']> | null | symbol;
  isReadonly: 0 | 1 | 2;
}

export default class NoteMetadataForm extends Form<NoteMetadata> {}

export const MULTIPLE_ICON_FLAG = Symbol();
