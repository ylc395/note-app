import type { NoteDTO } from 'interface/Note';

type NoteToEdit = Required<NoteDTO>;

export type NoteMetadata = {
  userCreatedAt?: NoteToEdit['userUpdatedAt'];
  userUpdatedAt?: NoteToEdit['userUpdatedAt'];
  icon: NoteToEdit['icon'];
  isReadonly?: NoteToEdit['isReadonly'];
};
