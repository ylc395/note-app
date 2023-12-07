import type { Note } from '@shared/domain/model/note/index.js';

export type NewNote = Partial<Note>;

export type NotePatch = Omit<NewNote, 'id' | 'createdAt'>;

export * from '@shared/domain/model/note/index.js';
