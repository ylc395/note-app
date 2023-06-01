import { Emitter } from 'strict-event-emitter';
import { container, singleton } from 'tsyringe';
import { observable, makeObservable, runInAction, action } from 'mobx';
import pull from 'lodash/pull';

import { token as remoteToken } from 'infra/remote';
import { type EntityId, EntityTypes, entityTypesToString, EntityLocator } from 'interface/entity';
import type { StarRecord, StarsDTO } from 'interface/star';

export enum StarEvents {
  Added = 'star.added',
  Removed = 'star.removed',
}

// todo: 能够收藏具体段落
@singleton()
export default class StarService extends Emitter<{
  [StarEvents.Added]: [{ type: EntityTypes; ids: EntityId[] }];
  [StarEvents.Removed]: [EntityLocator];
}> {
  constructor() {
    super();
    makeObservable(this);
  }

  private readonly remote = container.resolve(remoteToken);
  @observable stars?: Required<StarRecord>[];
  private async star(type: EntityTypes, ids: EntityId[]) {
    await this.remote.put<StarsDTO, StarRecord[]>(`/stars/${entityTypesToString[type]}`, { ids });
    this.emit(StarEvents.Added, { ids, type });
  }

  starNotes(ids: EntityId[]) {
    return this.star(EntityTypes.Note, ids);
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

    this.emit(StarEvents.Removed, { id: starToRemove.entityId, type: starToRemove.entityType });
  }
}
