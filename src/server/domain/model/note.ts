import type { NoteVO } from 'interface/note';

export type RawNoteVO = Omit<NoteVO, 'childrenCount' | 'isStar'>;
