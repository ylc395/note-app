import type { Note } from '@shared/domain/model/note/index.js';

export type NewNote = Omit<Partial<Note>, 'id'>;

export type NotePatch = Omit<NewNote, 'createdAt'>;

export * from '@shared/domain/model/note/index.js';
