import { observable, runInAction, action } from 'mobx';

import { container } from '#domain/shared/infra/singletons';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import type { TopicVO } from '#domain/shared/model/content';

export default class TopicManager {
  private readonly remote = container.resolve(remoteToken);
  @observable public accessor topics: TopicVO[] | undefined;

  public async load() {
    const topics = await this.remote.content.queryTopics.query();

    runInAction(() => {
      this.topics = topics;
    });
  }

  @action.bound
  public reset() {
    this.topics = undefined;
  }
}
