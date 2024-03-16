import { container, singleton, delay } from 'tsyringe';
import { observable, makeObservable, runInAction, computed, action } from 'mobx';
import { debounce, groupBy, remove } from 'lodash-es';

import { token as remoteToken } from '@domain/common/infra/rpc';
import { EntityTypes, type EntityLocator } from '@domain/app/model/entity';
import type { StarVO } from '@shared/domain/model/star';
import { Workbench } from './workbench';
import ExplorerManager from './ExplorerManager';

@singleton()
export default class StarManager {
  constructor() {
    makeObservable(this);
  }

  private readonly remote = container.resolve(remoteToken);
  private readonly workbench = container.resolve(Workbench);
  private readonly explorerManager = container.resolve(delay(() => ExplorerManager));

  @computed
  public get filteredStars() {
    const stars = this.keyword ? this.stars?.filter((star) => star.title.includes(this.keyword)) : this.stars;
    return groupBy(stars || [], 'entityType');
  }

  @observable private keyword = '';

  @observable private stars?: StarVO[];

  public readonly load = async () => {
    const stars = await this.remote.star.query.query();

    runInAction(() => {
      this.stars = stars;
    });
  };

  public readonly unstar = async ({ entityId, entityType }: EntityLocator) => {
    await this.remote.star.remove.mutate({ entityId });

    if (entityType !== EntityTypes.Annotation) {
      this.explorerManager.get(entityType).handleEntityUpdate({ id: entityId, trigger: this, isStar: false });
    }

    runInAction(() => {
      if (this.stars) {
        remove(this.stars, (star) => star.entityId === entityId);
      }
    });
  };

  public async star({ entityId, entityType }: EntityLocator) {
    const newStar = await this.remote.star.create.mutate({ entityId });

    if (entityType !== EntityTypes.Annotation) {
      this.explorerManager.get(entityType).handleEntityUpdate({ id: entityId, trigger: this, isStar: true });
    }

    if (this.stars) {
      this.stars.unshift(newStar);
    }
  }

  public readonly updateKeyword = debounce(
    action((keyword: string) => {
      this.keyword = keyword;
    }),
    500,
  );

  public readonly open = (entity: EntityLocator) => {
    this.workbench.openEntity(entity);
  };

  @action.bound
  public reset() {
    this.stars = undefined;
    this.keyword = '';
  }
}
