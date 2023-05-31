import Form from 'model/abstract/Form';
import type { NoteDTO } from 'interface/Note';

export interface NoteMetadata {
  icon: NonNullable<NoteDTO['icon']> | null | symbol;
  userCreatedAt?: NonNullable<NoteDTO['userCreatedAt']>;
  userUpdatedAt?: NonNullable<NoteDTO['userUpdatedAt']>;
  isReadonly: 0 | 1 | 2;
  attributes?: NonNullable<NoteDTO['attributes']>;
}

export default class NoteMetadataForm extends Form<NoteMetadata> {}

export const MULTIPLE_ICON_FLAG = Symbol();
