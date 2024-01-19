import { singleton, container } from 'tsyringe';
import { token as rpcToken } from '@domain/common/infra/rpc';
import assert from 'assert';

import type { MaterialVO } from '@shared/domain/model/material';
import MaterialTree from '@domain/common/model/material/Tree';
import Explorer, { RenameBehavior } from '@domain/app/model/abstract/Explorer';
import { compact } from 'lodash-es';

export { EventNames, type ActionEvent, RenameBehavior } from '@domain/app/model/abstract/Explorer';

@singleton()
export default class MaterialExplorer extends Explorer<MaterialVO> {
  public readonly tree = new MaterialTree();
  private readonly remote = container.resolve(rpcToken);

  public readonly rename = new RenameBehavior(this, ({ id, name }) =>
    this.remote.material.updateOne.mutate([id, { title: name }]),
  );

  constructor() {
    super('materialExplorer');
  }

  protected async getContextmenu() {
    const node = this.tree.selectedNodes[0];
    const isMultiple = this.tree.selectedNodes.length > 1;
    assert(node?.entity);

    return compact([!isMultiple && { label: '重命名', key: 'rename' }]);
  }
}
