import { container, singleton } from 'tsyringe';

import type { MaterialVO } from '@domain/shared/model/material';
import MaterialTree from '@domain/client/common/model/material/Tree';
import Explorer from '@domain/client/app/model/abstract/Explorer';
import RenameBehavior from '@domain/client/app/model/abstract/Explorer/RenameBehavior';
import eventBus, { Events } from './eventBus';
import StarManager, { Events as StarEvents } from '../StarManager';

@singleton()
export default class MaterialExplorer extends Explorer<MaterialVO> {
  public readonly tree = new MaterialTree({ sort: this.sorter.sort });
  private readonly starManager = container.resolve(StarManager);

  constructor() {
    super();
    this.starManager.on(StarEvents.Toggle, this.tree.updateTree);
    eventBus.on(Events.Updated, this.handleEntityUpdate);
  }

  protected queryPath(id: MaterialVO['id']) {
    return this.remote.material.queryPath.query(id);
  }

  private readonly submitRename = async ({ id, name }: { id: string; name: string }) => {
    await this.remote.material.updateOne.mutate([id, { title: name }]);
    eventBus.emit(Events.Updated, { trigger: this.rename, entity: { id, title: name } });
  };

  public readonly rename = new RenameBehavior({ onSubmit: this.submitRename });
}
