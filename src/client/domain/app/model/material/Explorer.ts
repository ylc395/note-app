import { singleton, container } from 'tsyringe';
import { token as rpcToken } from '@domain/common/infra/rpc';
import { compact } from 'lodash-es';

import { isEntityMaterial, type MaterialVO } from '@shared/domain/model/material';
import MaterialTree from '@domain/common/model/material/Tree';
import Explorer, { RenameBehavior } from '@domain/app/model/abstract/Explorer';
import { EntityTypes } from '../entity';
import eventBus, { Events } from './eventBus';
import ContextmenuBehavior from '../abstract/Explorer/ContextmenuBehavior';

@singleton()
export default class MaterialExplorer extends Explorer<MaterialVO> {
  public readonly tree = new MaterialTree();
  public readonly entityType = EntityTypes.Material;
  private readonly remote = container.resolve(rpcToken);
  public readonly rename: RenameBehavior;
  public readonly contextmenu: ContextmenuBehavior<MaterialVO>;

  constructor() {
    super();
    this.rename = new RenameBehavior({ onSubmit: this.submitRename });
    this.contextmenu = new ContextmenuBehavior({
      explorer: this,
      getItems: this.getContextmenuItems,
      handleAction: (e) => eventBus.emit(Events.Action, e),
    });
    eventBus.on(Events.Updated, this.handleEntityUpdate);
  }

  private readonly submitRename = async ({ id, name }: { id: string; name: string }) => {
    await this.remote.material.updateOne.mutate([id, { title: name }]);
    eventBus.emit(Events.Updated, { id, title: name, trigger: this });
  };

  private readonly getContextmenuItems = () => {
    const node = this.tree.getSelectedNode();
    const isMultiple = this.tree.selectedNodes.length > 1;

    const isDirectory = !node.entity || !isEntityMaterial(node.entity);
    const canOpenInNewTab = !isDirectory && !this.workbench.currentTile?.findByEntity(node.entityLocator);
    const canOpenTo = !isDirectory && this.workbench.currentTile;

    return compact([
      isMultiple && { label: `共${this.tree.selectedNodes.length}项`, disabled: true },
      isMultiple && ({ type: 'separator' } as const),
      canOpenInNewTab && { label: '新标签页打开', key: 'openInNewTab' },
      canOpenTo && {
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
      !isMultiple && node.entity && { label: node.entity.isStar ? '取消收藏' : '收藏', key: 'star' },
      { label: '移动至...', key: 'move' },
      { type: 'separator' } as const,
      { label: '删除', key: 'delete' },
    ]);
  };
}
