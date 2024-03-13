import { singleton, container } from 'tsyringe';
import assert from 'assert';

import Explorer from '@domain/app/model/material/Explorer';
import { token as rpcToken } from '@domain/common/infra/rpc';
import type { MaterialVO } from '@shared/domain/model/material';
import { EntityParentId, EntityTypes } from '../../model/entity';
import TreeNode from '@domain/common/model/abstract/TreeNode';
import MaterialEditor from '../../model/material/editor/MaterialEditor';
import MoveBehavior from '../common/MoveBehavior';
import eventBus, { type ActionEvent, Events } from '../../model/material/eventBus';
import CreationBehavior from './CreationBehavior';

@singleton()
export default class MaterialService {
  constructor() {
    eventBus.on(Events.Action, this.handleAction);
  }
  private readonly remote = container.resolve(rpcToken);
  private readonly explorer = container.resolve(Explorer);

  private readonly moveMaterials = async (parentId: EntityParentId, ids: MaterialVO['id'][]) => {
    await this.remote.material.batchUpdate.mutate([ids, { parentId }]);
    ids.forEach((id) => eventBus.emit(Events.Updated, { explorerUpdated: true, trigger: this.move, parentId, id }));
  };

  public readonly move = new MoveBehavior({
    explorer: this.explorer,
    itemToIds: MaterialService.getMaterialIds,
    onMove: this.moveMaterials,
  });

  public readonly creation = new CreationBehavior();

  private readonly handleAction = ({ action, id }: ActionEvent) => {
    const oneId = id[0];
    assert(oneId);

    switch (action) {
      case 'move':
        return this.move.selectTarget();
      default:
        break;
    }
  };

  public static getMaterialIds(item: unknown) {
    if (item instanceof TreeNode && item.entityLocator.entityType === EntityTypes.Material) {
      return item.tree.getSelectedNodeIds();
    }

    if (item instanceof MaterialEditor) {
      return [item.entityLocator.entityId];
    }
  }
}
