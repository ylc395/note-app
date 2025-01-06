import { action, observable } from 'mobx';
import { diffJson, type Change } from 'diff';
import { type ZodSchema, string, z } from 'zod';
import { intersection, maxBy, pick, uniqueId } from 'lodash-es';

import { token as lsToken } from '#domain/client/app/infra/localStorage';
import { container } from '#domain/shared/infra/singletons';
import type { EntityId } from '#domain/shared/model/entity';

export default class Backup<T> {
  constructor(private readonly entityId: EntityId, schema: ZodSchema<T>) {
    this.schema = z.record(
      string(),
      z.object({
        value: schema,
        timestamp: z.number(),
      }),
    );
  }

  private readonly id = uniqueId('backup-');

  private readonly schema;

  private readonly localStorage = container.resolve(lsToken);

  @observable.ref public accessor changes: Change[] | undefined;

  private get storageKey() {
    return `backup-${this.entityId}`;
  }

  @action
  public diff(source: object) {
    const allBackups = this.localStorage.get(this.storageKey, this.schema);
    const latest = maxBy(Object.values(allBackups || {}), ({ timestamp }) => timestamp);

    if (!latest) {
      return;
    }

    const commonKeys = intersection(Object.keys(latest), Object.keys(source));
    const changes = diffJson(pick(source, commonKeys), pick(latest, commonKeys));

    if (changes.length > 0) {
      this.changes = changes;
    }
  }

  public write(value: T) {
    const allBackups = this.localStorage.get(this.storageKey, this.schema) || {};

    allBackups[this.id] = {
      value,
      timestamp: Date.now(),
    };

    this.localStorage.set(this.storageKey, allBackups);
  }

  public clear() {
    const allBackups = this.localStorage.get(this.storageKey, this.schema) || {};

    delete allBackups[this.id];

    if (Object.keys(allBackups).length === 0) {
      this.localStorage.delete(this.storageKey);
    } else {
      this.localStorage.set(this.storageKey, allBackups);
    }
  }
}
