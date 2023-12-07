import type { EntityId, EntityParentId } from '../entity.js';
import dayjs from 'dayjs';

export interface Note {
  title: string;
  isReadonly: boolean;
  id: EntityId;
  parentId: EntityParentId;
  icon: string | null;
  updatedAt: number;
  userUpdatedAt: number;
  createdAt: number;
  body?: string;
}

export function normalizeTitle(note: Pick<Note, 'createdAt' | 'title'>) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
