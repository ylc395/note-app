import { Emitter } from 'strict-event-emitter';
import { container, singleton } from 'tsyringe';
import { observable, makeObservable, runInAction, action } from 'mobx';
import pull from 'lodash/pull';

import { token as remoteToken } from 'infra/remote';
import type { EntitiesLocator, EntityId, EntityLocator, EntityTypes } from 'model/entity';
import type { StarRecord, StarsDTO } from 'model/star';

export enum StarEvents {
  Added = 'star.added',
  Removed = 'star.removed',
}

// todo: 能够收藏具体段落
@singleton()
export default class StarService extends Emitter<{
  [StarEvents.Added]: [EntitiesLocator];
  [StarEvents.Removed]: [EntityLocator];
}> {
  constructor() {
    super();
    makeObservable(this);
  }

  private readonly remote = container.resolve(remoteToken);
  @observable stars?: Required<StarRecord>[];

  async star(entityType: EntityTypes, entityIds: EntityId[]) {
    await this.remote.patch<StarsDTO, StarRecord[]>('/stars', { entityType, entityIds });
    this.emit(StarEvents.Added, { entityType, entityIds });
  }

  @action
  clear() {
    this.stars = undefined;
  }

  async loadStars() {
    const { body: stars } = await this.remote.get<void, Required<StarRecord>[]>('/stars');
    runInAction(() => (this.stars = stars));
  }

  async removeStar(starId: StarRecord['id']) {
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
