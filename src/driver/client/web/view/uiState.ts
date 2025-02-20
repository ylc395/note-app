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

const schema = z
  .object({
    'app.sidebar': z.nativeEnum(SidebarTabs),
    'note.treeView': z.nativeEnum(NoteTreeViewTabs),
  })
  .partial();

export default class UIState extends PersistedObject<z.infer<typeof schema>> {
  constructor() {
    super('ui.state', schema);
  }
}
