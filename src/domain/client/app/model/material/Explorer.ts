import { container } from '#domain/shared/infra/singletons';
import type { MaterialVO } from '#domain/shared/model/material';
import MaterialTree from '#domain/client/shared/model/material/Tree';
import Explorer, { createUIState, type Events } from '#domain/client/app/model/abstract/Explorer';
import { EntityTypes } from '#domain/client/shared/model/entity';

import DomainEventBus from './EventBus';
import StarManager, { EventNames as StarEvents } from '../StarManager';
import EventBus from '../../infra/EventBus';
import RenameBehavior from '../abstract/Explorer/RenameBehavior';

export default class MaterialExplorer extends Explorer<MaterialVO> {
  constructor() {
    super();
    this.starManager.events.on(StarEvents.Toggle, this.tree.update);
    this.domainEventBus.on(DomainEventBus.eventNames.Updated, this.handleEntityUpdated.bind(this));
    this.rename = new RenameBehavior({ onSubmit: this.submitRename.bind(this) });
  }
  public readonly rename: RenameBehavior;

  private readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly entityType = EntityTypes.Material;

  public readonly tree = this.createTree();

  private readonly starManager = container.resolve(StarManager);

  public readonly uiState = createUIState('Material-Explorer');

  public readonly events = new EventBus<Events>('note-explorer');

  private readonly submitRename = async ({ id, name }: { id: string; name: string }) => {
    await this.remote.material.updateOne.mutate([id, { title: name }]);
    this.domainEventBus.emit(DomainEventBus.eventNames.Updated, { trigger: this, payload: { title: name }, id });
  };

  public createTree() {
    return new MaterialTree({
      sort: this.sorter.sort,
      isDisabled: this.isNodeDisabled.bind(this),
    });
  }
}
