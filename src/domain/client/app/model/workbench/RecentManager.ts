import z from 'zod';
import { compact, keyBy, uniqBy } from 'lodash-es';
import { createQuery } from 'mobx-tanstack-query/preset';

import container from '#utils/singletonContainer';
import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import { token } from '#domain/client/shared/infra/rpc';
import KvActiveRecord from '#domain/client/shared/model/abstract/KvActiveRecord';

const MAX_LENGTH = 6;

const historySchema = z
  .array(z.object({ id: z.string(), time: z.number() }))
  .transform((ids) => ids.slice(0, MAX_LENGTH));

export default class RecentManager extends KvActiveRecord {
  protected readonly key = 'recently-open';

  private readonly remote = container.resolve(token);

  @KvActiveRecord.bidi(historySchema)
  private accessor history: z.infer<typeof historySchema> = [];

  public add(id: NoteVO['id']) {
    this.history = uniqBy([{ id, time: Date.now() }, ...this.history], ({ id }) => id).slice(0, MAX_LENGTH);
  }

  public readonly notes = createQuery(
    async () => {
      const notes = await this.remote.note.query.query({ id: this.history.map(({ id }) => id) });
      const notesMap = keyBy(notes, ({ id }) => id);

      return compact(
        this.history.map(({ id, time }) => {
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
