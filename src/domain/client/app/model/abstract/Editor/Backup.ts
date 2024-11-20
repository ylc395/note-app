import { diffJson } from 'diff';
import type { ZodSchema } from 'zod';
import { intersection, pick } from 'lodash-es';

import { token as lsToken } from '#domain/client/app/infra/localStorage';
import { container } from '#domain/shared/infra/singletons';
import type { EntityId } from '#domain/shared/model/entity';

export default class Backup<T> {
  constructor(private readonly entityId: EntityId, private readonly schema: ZodSchema<T>) {}

  private readonly localStorage = container.resolve(lsToken);

  private get key() {
    return `editor-backup-${this.entityId}`;
  }

  public diff(source: object) {
    const backup = this.localStorage.get(this.key, this.schema);

    if (!backup) {
      return null;
    }

    const commonKeys = intersection(Object.keys(backup), Object.keys(source));
    return diffJson(pick(source, commonKeys), pick(backup, commonKeys));
  }

  public write(value: T) {
    this.localStorage.set(this.key, value);
  }

  public clear() {
    this.localStorage.delete(this.key);
  }
}
