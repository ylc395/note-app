import type { NoteDTO } from 'interface/Note';

export const MULTIPLE_ICON_FLAG = Symbol();

export interface NoteMetadata {
  icon: NonNullable<NoteDTO['icon']> | null | typeof MULTIPLE_ICON_FLAG;
  userCreatedAt?: NonNullable<NoteDTO['userCreatedAt']>;
  userUpdatedAt?: NonNullable<NoteDTO['userUpdatedAt']>;
  isReadonly: 0 | 1 | 2;
  attributes?: NonNullable<NoteDTO['attributes']>;
}
