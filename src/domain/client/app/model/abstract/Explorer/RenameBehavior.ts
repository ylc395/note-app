import { runInAction, observable, action } from 'mobx';
import assert from 'assert';
import type TreeNode from '#domain/client/shared/model/abstract/TreeNode';

export default class RenameBehavior {
  constructor(
    private readonly options: {
      onSubmit: (e: { id: TreeNode['id']; name: string }) => Promise<void>;
    },
  ) {}

  @observable public accessor id: TreeNode['id'] | undefined;

  @action
  public start(id: TreeNode['id']) {
    this.id = id;
  }

  public readonly submit = async (value: string) => {
    assert(this.id);
    await this.options.onSubmit({ id: this.id, name: value });

    runInAction(() => {
      this.id = undefined;
    });
  };

  @action.bound
  public cancel() {
    this.id = undefined;
  }
}
