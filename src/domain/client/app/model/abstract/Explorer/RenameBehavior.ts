import { observable, action } from 'mobx';
import assert from 'assert';
import type TreeNode from '#domain/client/shared/model/abstract/TreeNode';

export default class RenameBehavior {
  constructor(
    private readonly options: {
      onSubmit: (e: { id: TreeNode['id']; name: string }) => Promise<void>;
    },
  ) {}

  @observable public accessor editingId: TreeNode['id'] | undefined;

  @action
  public start(id: TreeNode['id']) {
    this.editingId = id;
  }

  public readonly submit = async (value: string) => {
    assert(this.editingId);
    await this.options.onSubmit({ id: this.editingId, name: value });
    this.cancel();
  };

  @action.bound
  public cancel() {
    this.editingId = undefined;
  }
}
