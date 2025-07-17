import { z } from 'zod';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import { NoteTypes } from '#domain/shared/model/note';

export enum SidebarTabs {
  Note = 'note',
  Memo = 'memo',
  Project = 'project',
}

const schema = z.object({
  'app.sidebar': z.enum(SidebarTabs),
  'note.treeView': z.enum(NoteTypes),
  'note.sidebar.proportion': z.number().array(),
  'memo.sidebarVisibility': z.union([z.literal('always'), z.literal('visible'), z.literal('hidden')]),
});

export default class UIState extends PersistedMap<z.infer<typeof schema>> {
  constructor() {
    super('ui.state', schema, {
      'app.sidebar': SidebarTabs.Note,
      'note.treeView': NoteTypes.Note,
      'note.sidebar.proportion': [20, 80],
      'memo.sidebarVisibility': 'visible',
    });
  }
}
