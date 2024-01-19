import { makeObservable, runInAction, observable, action } from 'mobx';
import assert from 'assert';

import type TreeNode from '@domain/common/model/abstract/TreeNode';
import type Explorer from './index';
import type { HierarchyEntity } from '../../entity';

export default class RenameBehavior<T extends HierarchyEntity> {
  constructor(
    private readonly options: {
      explorer: Explorer<T>;
      onSubmit: (e: { id: TreeNode['id']; name: string }) => Promise<T>;
    },
  ) {
    makeObservable(this);
  }

  @observable id?: TreeNode['id'];

  @action
  public start(id: TreeNode['id']) {
    this.id = id;
  }

  public readonly submit = async (value: string) => {
    assert(this.id);
    const material = await this.options.onSubmit({ id: this.id, name: value });
    this.options.explorer.tree.updateTree(material);

    runInAction(() => {
      this.id = undefined;
    });
  };

  @action.bound
  public cancel() {
    this.id = undefined;
  }
}
