import { diffJson, type Change } from 'diff';
import type { ZodSchema } from 'zod';
import { intersection, pick } from 'lodash-es';

import { token as lsToken } from '#domain/client/app/infra/localStorage';
import { container } from '#domain/shared/infra/singletons';
import type { EntityId } from '#domain/shared/model/entity';
import { observable } from 'mobx';

export default class Backup<T> {
  constructor(private readonly entityId: EntityId, private readonly schema: ZodSchema<T>) {}

  private readonly localStorage = container.resolve(lsToken);

  private get key() {
    return `editor-backup-${this.entityId}`;
  }

  public diff(source: object) {
    const backup = this.localStorage.get(this.key, this.schema);

    if (!backup) {
      return;
    }

    const commonKeys = intersection(Object.keys(backup), Object.keys(source));
    const changes = diffJson(pick(source, commonKeys), pick(backup, commonKeys));

    if (changes.length > 0) {
      this.changes = changes;
    }
  }

  @observable.ref public accessor changes: Change[] | undefined;

  public write(value: T) {
    this.localStorage.set(this.key, value);
  }

  public clear() {
    this.localStorage.delete(this.key);
  }
}
