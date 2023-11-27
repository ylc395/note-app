import dayjs from 'dayjs';
import { NoteVO, DetailedNoteVO } from '../../../../shared/model/note';

export function normalizeTitle(note: NoteVO | DetailedNoteVO) {
  return note.title || `未命名笔记-${dayjs(note.createdAt).format('YYYYMMDD-HHmm')}`;
}
