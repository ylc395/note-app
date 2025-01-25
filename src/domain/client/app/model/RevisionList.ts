import { createQuery } from 'mobx-tanstack-query/preset';
import { action } from 'mobx';

import type { EntityId } from '#domain/shared/model/entity';
import { container } from '#domain/shared/infra/singletons';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import type { RevisionPatchDTO, RevisionVO } from '#domain/shared/model/revision';

export default class RevisionList {
  constructor(entityId: EntityId) {
    this.data = createQuery(() => this.remote.revision.queryAll.query(entityId), {
      queryKey: ['revisions', entityId],
      enableOnDemand: true,
    });
  }

  private readonly remote = container.resolve(remoteToken);

  public readonly data;

  public async update(id: RevisionVO['id'], patch: RevisionPatchDTO) {
    await this.remote.revision.update.mutate([id, patch]);
    this.data.invalidate();
  }

  @action
  public destroy() {
    this.data.destroy();
  }
}
