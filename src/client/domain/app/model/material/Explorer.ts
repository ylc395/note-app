import { singleton } from 'tsyringe';

import type { MaterialVO } from '@shared/domain/model/material';
import MaterialTree from '@domain/common/model/material/Tree';
import Explorer, { RenameBehavior } from '@domain/app/model/abstract/Explorer';
import eventBus, { Events } from './eventBus';

@singleton()
export default class MaterialExplorer extends Explorer<MaterialVO> {
  public readonly tree = new MaterialTree({ sort: this.sorter.sort });

  constructor() {
    super();
    eventBus.on(Events.Updated, this.handleEntityUpdate);
  }

  protected queryPath(id: MaterialVO['id']) {
    return this.remote.material.queryPath.query(id);
  }

  private readonly submitRename = async ({ id, name }: { id: string; name: string }) => {
    await this.remote.material.updateOne.mutate([id, { title: name }]);
    eventBus.emit(Events.Updated, { id, trigger: this.rename, title: name });
  };

  public readonly rename = new RenameBehavior({ onSubmit: this.submitRename });
}
