import z from 'zod';
import { compact, keyBy, uniqBy } from 'lodash-es';
import { createQuery } from 'mobx-tanstack-query/preset';
import { when } from 'mobx';

import container from '#utils/singletonContainer';
import PersistedMap from '#domain/client/shared/model/abstract/PersistedMap';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import { token } from '#domain/client/shared/infra/rpc';

export default class RecentManager {
  private readonly remote = container.resolve(token);

  private static readonly MAX_LENGTH = 6;

  private readonly openingHistory = new PersistedMap(
    'opened-notes',
    z.object({
      ids: z
        .array(z.object({ id: z.string(), time: z.number() }))
        .transform((ids) => ids.slice(0, RecentManager.MAX_LENGTH))
        .catch(() => []),
    }),
  );

  public add(id: NoteVO['id']) {
    const openedIds = this.openingHistory.get('ids');

    openedIds.unshift({ id, time: Date.now() });
    this.openingHistory.set('ids', uniqBy(openedIds, ({ id }) => id).slice(0, RecentManager.MAX_LENGTH));
  }

  public readonly ready = (cb: () => void) => when(() => this.openingHistory.isReady).then(cb);

  public readonly notes = createQuery(
    async () => {
      const records = this.openingHistory.get('ids');
      const notes = await this.remote.note.query.query({ id: records.map(({ id }) => id) });
      const notesMap = keyBy(notes, ({ id }) => id);

      return compact(
        records.map(({ id, time }) => {
          const note = notesMap[id];

          if (!note) {
            return;
          }

          return {
            id,
            mimeType: note.mimeType,
            title: normalizeTitle(note),
            time,
          };
        }),
      );
    },
    {
      enabled: false, // 让视图层手动去 refetch
    },
  );
}
