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
  'app.sidebar': z.nativeEnum(SidebarTabs).catch(SidebarTabs.Note) as z.ZodType<SidebarTabs>, // catch 必须搭配这些 as 使用。见 https://github.com/colinhacks/zod/issues/2852

  'note.treeView': z.nativeEnum(NoteTreeViewTabs).catch(NoteTreeViewTabs.Note) as z.ZodType<NoteTreeViewTabs>,

  'note.sidebar.proportion': z.unknown(),

  'memo.sidebarVisibility': z
    .union([z.literal('always'), z.literal('visible'), z.literal('hidden')])
    .catch('visible') as z.ZodType<'always' | 'visible' | 'hidden'>,
});

export default class UIState extends PersistedObject<z.infer<typeof schema>> {
  constructor() {
    super('ui.state', schema);
  }
}
