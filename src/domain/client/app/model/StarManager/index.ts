import { observable, runInAction, computed, action } from 'mobx';
import { debounce, remove } from 'lodash-es';

import { container } from '#domain/shared/infra/singletons';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import type { StarVO } from '#domain/shared/model/star';
import type { EntityId } from '#domain/shared/model/entity';
import EventBus from '../../infra/EventBus';
import { EventNames, type Events } from './events';

export default class StarManager extends EventBus<Events> {
  private readonly remote = container.resolve(remoteToken);

  constructor() {
    super('StarManager');
  }

  @observable public accessor keyword = '';

  @observable public accessor isVisible = false;

  @observable.shallow private accessor stars: StarVO[] | undefined;

  @computed
  public get filteredStars() {
    const stars = this.keyword ? this.stars?.filter((star) => star.entity.title.includes(this.keyword)) : this.stars;
    return Object.groupBy(stars || [], ({ entity: { type } }) => type);
  }

  @action.bound
  public show() {
    this.load();
    this.isVisible = false;
  }

  public readonly load = async () => {
    const stars = await this.remote.star.query.query();

    runInAction(() => {
      this.stars = stars;
    });
  };

  public readonly star = async (entityId: EntityId) => {
    const newStar = await this.remote.star.create.mutate({ entityId });
    this.emit(EventNames.Toggle, { id: entityId, isStar: true });

    runInAction(() => {
      if (this.stars) {
        this.stars.unshift(newStar);
      }
    });
  };

  public readonly unstar = async (entityId: EntityId) => {
    await this.remote.star.remove.mutate(entityId);
    this.emit(EventNames.Toggle, { id: entityId, isStar: false });

    runInAction(() => {
      if (this.stars) {
        remove(this.stars, (star) => star.entity.id === entityId);
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
    this.isVisible = false;
  }
}
