import { container, singleton } from 'tsyringe';
import { observable, makeObservable, runInAction, computed, action } from 'mobx';
import { debounce, groupBy, remove } from 'lodash-es';

import { token as remoteToken } from '@domain/common/infra/rpc';
import type { EntityId } from '@domain/app/model/entity';
import type { StarVO } from '@shared/domain/model/star';

@singleton()
export default class StarManager {
  constructor() {
    makeObservable(this);
  }

  private readonly remote = container.resolve(remoteToken);

  @computed
  public get filteredStars() {
    const stars = this.keyword ? this.stars?.filter((star) => star.title.includes(this.keyword)) : this.stars;
    return groupBy(stars || [], 'entityType');
  }

  @observable private keyword = '';

  @observable private stars?: StarVO[];

  public readonly star = async (entityId: EntityId) => {
    const newStar = await this.remote.star.create.mutate({ entityId });

    if (this.stars) {
      this.stars.unshift(newStar);
    }
  };

  public readonly load = async () => {
    const stars = await this.remote.star.query.query();

    runInAction(() => {
      this.stars = stars;
    });
  };

  public readonly unstar = async (entityId: EntityId) => {
    await this.remote.star.remove.mutate({ entityId });

    runInAction(() => {
      if (this.stars) {
        remove(this.stars, (star) => star.entityId === entityId);
      }
    });
  };

  public readonly updateKeyword = debounce(
    action((keyword: string) => {
      this.keyword = keyword;
    }),
    500,
  );

  @action.bound
  public reset() {
    this.stars = undefined;
    this.keyword = '';
  }
}
