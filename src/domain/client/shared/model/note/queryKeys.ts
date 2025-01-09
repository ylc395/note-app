import type { NoteVO } from '#domain/shared/model/note';

export function getChildrenNoteQueryKey(parentId: NoteVO['parentId']) {
  return ['notes', 'children', parentId];
}
