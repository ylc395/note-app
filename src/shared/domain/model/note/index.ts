import dayjs from 'dayjs';
import type { NoteVO } from './vo.js';
import type { Note } from './base.js';

export function normalizeTitle(note: Note | NoteVO) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}

export * from './base.js';
export * from './dto.js';
export * from './vo.js';
export * from './query.js';
