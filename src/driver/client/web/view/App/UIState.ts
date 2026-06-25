import { z } from 'zod';
import KvActiveRecord from '#domain/client/shared/model/abstract/KvActiveRecord';

export enum SidebarTabs {
  Note = 'note',
  Memo = 'memo',
  Project = 'project',
}

export enum NoteTabs {
  All = 'all',
  SearchResult = 'searchResult',
}

const schema = {
  explorer: z.object({
    type: z.enum(SidebarTabs).catch(SidebarTabs.Note),
    proportion: z
      .number()
      .array()
      .catch(() => [20, 80]),
    noteExplorer: z
      .object({
        tab: z.enum(NoteTabs).optional().catch(NoteTabs.All),
      })
      .catch(() => ({})),
  }),
};

export default class UIState extends KvActiveRecord {
  protected override key = 'app-view-state';

  @KvActiveRecord.bidi(schema.explorer)
  public accessor explorer = schema.explorer.parse({});
}
