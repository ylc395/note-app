import EventEmitter from 'eventemitter3';
import { container, singleton } from 'tsyringe';
import { observable, makeObservable, runInAction, action } from 'mobx';
import pull from 'lodash/pull';

import { token as remoteToken } from 'infra/Remote';
import { type EntityId, EntityTypes, entityTypesToString } from 'interface/entity';
import type { StarRecord, StarsDTO } from 'interface/star';

export enum StarEvents {
  NoteAdded = 'star.note.added',
  NoteRemoved = 'star.note.removed',
  MemoAdded = 'star.memo.added',
  MemoRemoved = 'star.memo.removed',
}

const removeEventsMap: Record<EntityTypes, StarEvents> = {
  [EntityTypes.Note]: StarEvents.NoteRemoved,
  [EntityTypes.Memo]: StarEvents.MemoRemoved,
};

const addEventsMap: Record<EntityTypes, StarEvents> = {
  [EntityTypes.Note]: StarEvents.NoteAdded,
  [EntityTypes.Memo]: StarEvents.MemoAdded,
};

// todo: 能够收藏具体段落
@singleton()
export default class StarService extends EventEmitter {
  constructor() {
    super();
    makeObservable(this);
  }

  private readonly remote = container.resolve(remoteToken);
  @observable stars?: Required<StarRecord>[];
  private async star(type: EntityTypes, ids: EntityId[]) {
    const { body: stars } = await this.remote.put<StarsDTO, StarRecord[]>(`/stars/${entityTypesToString[type]}`, {
      ids,
    });

    for (const star of stars) {
      this.emit(addEventsMap[type], star.entityId);
    }
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

    this.emit(removeEventsMap[starToRemove.entityType], starToRemove.entityId);
  }
}
