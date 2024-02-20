import { container, singleton } from 'tsyringe';
import { observable, makeObservable, runInAction } from 'mobx';
import { remove } from 'lodash-es';
import assert from 'assert';

import { token as remoteToken } from '@domain/common/infra/rpc';
import type { EntityId } from '@domain/app/model/entity';
import type { StarVO } from '@shared/domain/model/star';

@singleton()
export default class StarService {
  constructor() {
    makeObservable(this);
  }

  private readonly remote = container.resolve(remoteToken);

  @observable public stars?: StarVO[];

  public async star(entityId: EntityId) {
    assert(this.stars);

    const newStar = await this.remote.star.create.mutate({ entityId });
    this.stars.unshift(newStar);
  }

  public async load() {
    const stars = await this.remote.star.query.query();

    runInAction(() => {
      this.stars = stars;
    });
  }

  public async remove(entityId: EntityId) {
    await this.remote.star.remove.mutate({ entityId });

    runInAction(() => {
      assert(this.stars);
      remove(this.stars, (star) => star.entityId === entityId);
    });
  }
}
