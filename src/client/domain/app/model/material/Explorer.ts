import { container, singleton } from 'tsyringe';
import { observable, makeObservable, action, runInAction } from 'mobx';
import assert from 'assert';

import { isEntityMaterial, type MaterialVO } from '@shared/domain/model/material';
import MaterialTree from '@domain/common/model/material/Tree';
import Explorer from '@domain/app/model/abstract/Explorer';
import { token } from '@domain/common/infra/rpc';
import { compact } from 'lodash-es';

export { EventNames, type ActionEvent } from '@domain/app/model/abstract/Explorer';

@singleton()
export default class MaterialExplorer extends Explorer<MaterialVO> {
  public readonly tree = new MaterialTree();
  private readonly remote = container.resolve(token);

  constructor() {
    super('materialExplorer');
    makeObservable(this);
  }

  @observable editingId?: MaterialVO['id'];

  @action
  public startRenaming(id: MaterialVO['id']) {
    this.editingId = id;
  }

  public readonly submitRenaming = async (value: string) => {
    assert(this.editingId);
    const material = await this.remote.material.updateOne.mutate([this.editingId, { title: value }]);
    this.tree.updateTree(material);

    runInAction(() => {
      this.editingId = undefined;
    });
  };

  @action.bound
  public cancelRenaming() {
    this.editingId = undefined;
  }

  protected async getContextmenu() {
    const node = this.tree.selectedNodes[0];
    const isMultiple = this.tree.selectedNodes.length > 1;
    assert(node?.entity);

    return compact([!isMultiple && !isEntityMaterial(node.entity) && { label: '重命名', key: 'rename' }]);
  }
}
