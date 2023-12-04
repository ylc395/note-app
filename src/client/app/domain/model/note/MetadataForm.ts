import Form from '@domain/model/abstract/Form';
import type { NotePatchDTO as NotePatch } from '@domain/model/note';

export interface NoteMetadata {
  icon: NonNullable<NotePatch['icon']> | null | symbol;
  isReadonly: 0 | 1 | 2;
}

export default class NoteMetadataForm extends Form<NoteMetadata> {}

export const MULTIPLE_ICON_FLAG = Symbol();
