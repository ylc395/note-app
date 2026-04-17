import z from 'zod';
import { uniqBy } from 'lodash-es';

import KvActiveRecord from '#domain/client/shared/model/abstract/KvActiveRecord';

const MAX_LENGTH = 6;

const recordSchema = z.object({
  entityId: z.string(),
  time: z.number(),
  title: z.string(),
  mimeType: z.string().nullish(),
});

const historySchema = z.array(recordSchema).transform((records) => records.slice(0, MAX_LENGTH));

type Record = z.infer<typeof recordSchema>;

export default class RecentManager extends KvActiveRecord {
  protected readonly key = 'recently-open';

  @KvActiveRecord.bidi(historySchema)
  public accessor history: z.infer<typeof historySchema> = [];

  public add(record: Omit<Record, 'time'>) {
    this.history = uniqBy([{ ...record, time: Date.now() }, ...this.history], ({ entityId }) => entityId).slice(
      0,
      MAX_LENGTH,
    );
  }
}
