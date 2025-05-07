import { z } from 'zod';
import PersistedObject from '#domain/client/shared/model/abstract/PersistedObject';

export enum SidebarTabs {
  Note = 'note',
  Memo = 'memo',
  Project = 'project',
}

export enum NoteTreeViewTabs {
  Note = 'note',
  Material = 'material',
}

const schema = z.object({
  'app.sidebar': z.nativeEnum(SidebarTabs),
  'note.treeView': z.nativeEnum(NoteTreeViewTabs),
  'note.sidebar.proportion': z.number().array(),
  'memo.sidebarVisibility': z.union([z.literal('always'), z.literal('visible'), z.literal('hidden')]),
});

export default class UIState extends PersistedObject<z.infer<typeof schema>> {
  constructor() {
    super('ui.state', schema, {
      'app.sidebar': SidebarTabs.Note,
      'note.treeView': NoteTreeViewTabs.Note,
      'note.sidebar.proportion': [20, 80],
      'memo.sidebarVisibility': 'visible',
    });
  }
}
