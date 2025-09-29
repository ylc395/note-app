import { z } from 'zod';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';

export enum SidebarTabs {
  Note = 'note',
  Memo = 'memo',
  Project = 'project',
}

const schema = z.object({
  'app.explorer': z.enum(SidebarTabs).catch(SidebarTabs.Note),
  'app.explorer.proportion': z
    .number()
    .array()
    .catch(() => [20, 80]),
  'memo.sidebarVisibility': z.union([z.literal('always'), z.literal('visible'), z.literal('hidden')]).catch('visible'),
});

export default class UIState extends PersistedMap<z.infer<typeof schema>> {
  constructor() {
    super('ui.state', schema);
  }
}
