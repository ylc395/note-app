import { z } from 'zod';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import { NoteTypes } from '#domain/shared/model/note';

export enum SidebarTabs {
  Note = 'note',
  Memo = 'memo',
  Project = 'project',
}

const schema = z.object({
  'app.sidebar': z.enum(SidebarTabs).default(SidebarTabs.Note),
  'note.treeView': z.enum(NoteTypes).default(NoteTypes.Document),
  'note.sidebar.proportion': z
    .number()
    .array()
    .default(() => [20, 80]),
  'memo.sidebarVisibility': z
    .union([z.literal('always'), z.literal('visible'), z.literal('hidden')])
    .default('visible'),
});

export default class UIState extends PersistedMap<z.infer<typeof schema>> {
  constructor() {
    super('ui.state', schema);
  }
}
