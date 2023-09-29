import { Emitter } from 'strict-event-emitter';
import { container, singleton } from 'tsyringe';
import { observable, makeObservable, runInAction, action } from 'mobx';
import pull from 'lodash/pull';

import { token as remoteToken } from 'infra/remote';
import type { EntityId, EntityLocator, EntityTypes } from 'model/entity';
import type { StarVO, StarsDTO } from 'model/star';
import { getLocators } from 'utils/collection';

export enum StarEvents {
  Added = 'star.added',
  Removed = 'star.removed',
}

// todo: 能够收藏具体段落
@singleton()
export default class StarService extends Emitter<{
  [StarEvents.Added]: [EntityLocator[]];
  [StarEvents.Removed]: [EntityLocator];
}> {
  constructor() {
    super();
    makeObservable(this);
  }

  private readonly remote = container.resolve(remoteToken);
  @observable stars?: Required<StarVO>[];

  async star(entityType: EntityTypes, entityIds: EntityId[]) {
    const entities = getLocators(entityIds, entityType);
    await this.remote.patch<StarsDTO>('/stars', entities);
    this.emit(StarEvents.Added, entities);
  }

  @action
  clear() {
    this.stars = undefined;
  }

  async loadStars() {
    const { body: stars } = await this.remote.get<void, StarVO[]>('/stars');
    runInAction(() => (this.stars = stars));
  }

  async removeStar(starId: StarVO['id']) {
    if (!this.stars) {
      throw new Error('no stars');
    }

    const starToRemove = this.stars.find(({ id }) => id === starId);

    if (!starToRemove) {
      throw new Error('no star to remove');
    }

    await this.remote.delete(`/stars/${starId}`);

    runInAction(() => {
      if (!this.stars) {
        throw new Error('no stars');
      }

      pull(this.stars, starToRemove);
    });

    this.emit(StarEvents.Removed, starToRemove);
  }
}
