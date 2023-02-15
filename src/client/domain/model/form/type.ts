import type { NoteDTO } from 'interface/Note';

export type NoteMetadata = Pick<NoteDTO, 'icon' | 'userCreatedAt' | 'userUpdatedAt' | 'isReadonly'>;
