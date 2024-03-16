import { container, singleton } from 'tsyringe';
import { observable, makeObservable, runInAction, action } from 'mobx';

import { token as remoteToken } from '@domain/common/infra/rpc';
import type { EntityLocator } from '@domain/app/model/entity';
import type { TopicVO } from '@shared/domain/model/content/topic';
import { Workbench } from './workbench';

@singleton()
export default class TopicManager {
  constructor() {
    makeObservable(this);
  }

  private readonly remote = container.resolve(remoteToken);
  private readonly workbench = container.resolve(Workbench);
  @observable public topics?: TopicVO[];

  public readonly load = async () => {
    const topics = await this.remote.content.queryTopics.query();

    runInAction(() => {
      this.topics = topics;
    });
  };

  public readonly open = (entity: EntityLocator) => {
    this.workbench.openEntity(entity);
  };

  @action.bound
  public reset() {
    this.topics = undefined;
  }
}
