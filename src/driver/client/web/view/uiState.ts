import { z } from 'zod';
import KvActiveRecord from '#domain/client/shared/model/abstract/KvActiveRecord';

export enum SidebarTabs {
  Note = 'note',
  Memo = 'memo',
  Project = 'project',
}

const schema = {
  explorer: z.object({
    type: z.enum(SidebarTabs).catch(SidebarTabs.Note),
    proportion: z
      .number()
      .array()
      .catch(() => [20, 80]),
  }),
};

export default class UIState extends KvActiveRecord {
  protected override key = 'app-view-state';

  @KvActiveRecord.bidi(schema.explorer)
  public accessor explorer = schema.explorer.parse({});
}
