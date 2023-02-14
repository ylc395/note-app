import { container, singleton } from 'tsyringe';
import { observable, makeObservable, runInAction } from 'mobx';
import remove from 'lodash/remove';

import { token as remoteToken } from 'infra/Remote';
import { token as userFeedbackToken } from 'infra/UserFeedback';
import { EntityTypes } from 'interface/Entity';
import type { StarRecord, StarsDTO } from 'interface/Star';

const paths = {
  [EntityTypes.Note]: 'notes',
} as const;

@singleton()
export default class StarService {
  constructor() {
    makeObservable(this);
  }

  private readonly userFeedback = container.resolve(userFeedbackToken);
  private readonly remote = container.resolve(remoteToken);
  @observable stars?: Required<StarRecord>[];
  private async star(type: EntityTypes, ids: string[]) {
    await this.remote.put<StarsDTO>(`/stars/${paths[type]}`, { ids });
    this.userFeedback.message.success({ content: '已收藏' });
  }

  starNotes(ids: string[]) {
    return this.star(EntityTypes.Note, ids);
  }

  async loadStars() {
    const { body: stars } = await this.remote.get<void, Required<StarRecord>[]>('/stars');
    runInAction(() => (this.stars = stars));
  }

  async removeStar(starId: StarRecord['id']) {
    await this.remote.delete(`/stars/${starId}`);
    runInAction(() => {
      if (!this.stars) {
        throw new Error('no stars');
      }

      remove(this.stars, ({ id }) => starId === id);
    });
  }
}
