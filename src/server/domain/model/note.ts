import type { Note } from 'shared/model/note';

export type NewNote = Partial<Note>;

export type NotePatch = Omit<NewNote, 'id' | 'createdAt'>;

export * from 'shared/model/note';
