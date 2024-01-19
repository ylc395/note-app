import { singleton, container } from 'tsyringe';
import { token as rpcToken } from '@domain/common/infra/rpc';
import assert from 'assert';
import { compact } from 'lodash-es';

import type { MaterialVO } from '@shared/domain/model/material';
import MaterialTree from '@domain/common/model/material/Tree';
import Explorer, { RenameBehavior } from '@domain/app/model/abstract/Explorer';
import { EntityTypes } from '../entity';

export { EventNames, type ActionEvent, RenameBehavior } from '@domain/app/model/abstract/Explorer';

@singleton()
export default class MaterialExplorer extends Explorer<MaterialVO> {
  public readonly tree = new MaterialTree();
  public readonly entityType = EntityTypes.Material;
  private readonly remote = container.resolve(rpcToken);

  public readonly rename = new RenameBehavior({
    explorer: this,
    onSubmit: ({ id, name }) => this.remote.material.updateOne.mutate([id, { title: name }]),
  });

  constructor() {
    super('materialExplorer');
  }

  protected getContextmenu() {
    const node = this.tree.selectedNodes[0];
    const isMultiple = this.tree.selectedNodes.length > 1;
    assert(node?.entity);
    const canOpenInNewTab = !this.workbench.currentTile?.findByEntity(node.entityLocator);

    return compact([
      isMultiple && { label: `共${this.tree.selectedNodes.length}项`, disabled: true },
      isMultiple && ({ type: 'separator' } as const),
      canOpenInNewTab && { label: '新标签页打开', key: 'openInNewTab' },
      this.workbench.currentTile && {
        label: '打开至...',
        submenu: [
          { label: '左边', key: 'openToLeft' },
          { label: '右边', key: 'openToRight' },
          { label: '上边', key: 'openToTop' },
          { label: '下边', key: 'openToBottom' },
        ],
      },
      { type: 'separator' } as const,
      !isMultiple && { label: '重命名', key: 'rename' },
      { label: '移动至...', key: 'move' },
    ]);
  }
}
